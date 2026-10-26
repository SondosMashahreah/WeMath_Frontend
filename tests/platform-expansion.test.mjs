import assert from "node:assert/strict";
import test from "node:test";
import { EXTENSION_IDS, hiveItem, externalURL, pageControls, PAGE_SIZE } from "../src/features/platform/domain/navigation.js";
import { request, teacherAccess, teacherLogout, teacherToken, TEACHER_SESSION_KEY } from "../src/features/platform/infrastructure/client.js";

function storage(t) {
  const values = new Map([["wemath.session.v1", "protected-family-token"]]);
  const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } });
  t.after(() => { if (original) Object.defineProperty(globalThis, "sessionStorage", original); else delete globalThis.sessionStorage; });
  return values;
}

test("only the seven unfinished home entries are intercepted", () => {
  assert.equal(EXTENSION_IDS.size, 7);
  for (const id of ["students", "parents", "steam"]) assert.equal(EXTENSION_IDS.has(id), false);
});
test("hive labels fit and lists reserve control cells", () => {
  const item = hiveItem("long", "أ".repeat(180));
  assert.equal(item.label.length, 180); assert.ok(item.lines[0].length <= 48);
  assert.ok(PAGE_SIZE + pageControls(99, 6).length + 3 <= 12);
});
test("external links accept HTTPS only and no embedded credentials", () => {
  assert.equal(externalURL("javascript:alert(1)"), null);
  assert.equal(externalURL("https://name:password@example.org/a"), null);
  assert.equal(externalURL("https://example.org/book.pdf"), "https://example.org/book.pdf");
});
test("public requests never transmit the family or teacher token", async t => {
  const values = storage(t); values.set(TEACHER_SESSION_KEY, "teacher-token");
  t.mock.method(globalThis, "fetch", async (_url, options) => { assert.equal(options.headers.Authorization, undefined); return { ok: true, json: async () => ({}) }; });
  await request("/api/platform/guest/catalog");
  assert.equal(values.get("wemath.session.v1"), "protected-family-token");
});
test("wrong-role and cancelled responses cannot create a teacher session", async t => {
  storage(t);
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ access_token: "bad", user: { role: "parent" } }) }));
  await assert.rejects(teacherAccess("login", {})); assert.equal(teacherToken(), "");
  const controller = new AbortController(); controller.abort();
  await assert.rejects(teacherAccess("login", {}, controller.signal), { name: "AbortError" });
});
test("delayed logout cannot clear a newer teacher session or the family session", async t => {
  const values = storage(t); values.set(TEACHER_SESSION_KEY, "old-teacher");
  let finish;
  t.mock.method(globalThis, "fetch", () => new Promise(resolve => { finish = resolve; }));
  const pending = teacherLogout(); values.set(TEACHER_SESSION_KEY, "new-teacher");
  finish({ ok: true, json: async () => ({ success: true }) }); await pending;
  assert.equal(teacherToken(), "new-teacher"); assert.equal(values.get("wemath.session.v1"), "protected-family-token");
});
