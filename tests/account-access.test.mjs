import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { accountRepository } from "../src/features/account/infrastructure/accountRepository.js";
import { canEnterPortal, restoredPortalRole } from "../src/features/account/domain/portalAccess.js";
import { getToken, setToken } from "../src/shared/api/client.js";

const credentials = { username: "test-user", password: "test-password-123" };
const student = { id: 2, roles: ["student"], grade: 4 };
const parent = { id: 1, roles: ["parent"], grade: null };
const response = value => ({ ok: true, status: 200, json: async () => value });
afterEach(() => setToken(null));

test("entries accept only their role; ambiguous restored accounts must choose an entry", () => {
  assert(canEnterPortal(student, "student"));
  assert(!canEnterPortal(parent, "student"));
  assert(!canEnterPortal(student, "parent"));
  assert.equal(restoredPortalRole(student), "student");
  assert.equal(restoredPortalRole(parent), "parent");
  assert.equal(restoredPortalRole({ roles: ["student", "parent"] }), null);
  assert.equal(restoredPortalRole({ roles: ["admin"] }), null);
});

test("wrong-role credentials never become the active session in either entry", async t => {
  let candidate;
  t.mock.method(globalThis, "fetch", async url => response(url.endsWith("/login") ? { access_token: "candidate-token" } : candidate));
  for (const [role, profile, message] of [["student", parent, /ليس حساب طالب/], ["parent", student, /ليس حساب أهل/]]) {
    candidate = profile;
    setToken("existing-token");
    await assert.rejects(accountRepository.login(credentials, { role }), message);
    assert.equal(getToken(), "existing-token");
  }
});

test("student login returns the saved grade and switches the active account", async t => {
  setToken("parent-token");
  accountRepository.clearSession();
  assert.equal(getToken(), null);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/login")) {
      assert.deepEqual(JSON.parse(options.body), credentials);
      return response({ access_token: "student-token" });
    }
    assert.equal(options.headers.Authorization, "Bearer student-token");
    return response(student);
  });
  assert.deepEqual(await accountRepository.login(credentials, { role: "student" }), student);
  assert.equal(getToken(), "student-token");
});

test("closing or changing the login form cannot install a late response", async t => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async url => {
    if (url.endsWith("/login")) return response({ access_token: "late-token" });
    controller.abort();
    // Simulate a transport that finishes despite cancellation.
    return response(student);
  });
  await assert.rejects(accountRepository.login(credentials, { role: "student", signal: controller.signal }), { name: "AbortError" });
  assert.equal(getToken(), null);
});

test("registration checks the returned account role before accepting its token", async t => {
  t.mock.method(globalThis, "fetch", async () => response({ access_token: "wrong-token", user: parent }));
  await assert.rejects(accountRepository.register({ ...credentials, role: "student", grade: 4 }), /ليس حساب طالب/);
  assert.equal(getToken(), null);
});
