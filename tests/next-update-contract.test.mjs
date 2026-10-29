import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("2026 update keeps the requested home contract", () => {
  const config = read("src/lib/beeConfig.js");
  const routes = read("src/app/routing/routes.jsx");
  assert.doesNotMatch(config, /#FFD800/i);
  assert.match(read("src/features/student/presentation/student.css"), /#F78B35/i);
  assert.match(config, /PARP/);
  assert.doesNotMatch(config, /id:\s*["']guest["']/);
  assert.doesNotMatch(routes, /GuestPage/);
  assert.doesNotMatch(routes, /research/);
});

test("lesson resources expose exactly the six requested activity ids", () => {
  const paths = read("src/shared/routing/paths.js");
  for (const id of ["quiz", "worksheet", "film", "activity", "game", "story_video"]) assert.match(paths, new RegExp(`\"${id}\"`));
  for (const old of ["learn", "practice", "video"]) assert.doesNotMatch(paths, new RegExp(`\"${old}\"`));
});

test("student account and senior track contracts are wired", () => {
  const validation = read("src/features/student/domain/accessValidation.js");
  const repository = read("src/features/account/infrastructure/accountRepository.js");
  assert.match(validation, /track/);
  assert.match(repository, /changePassword/);
});
