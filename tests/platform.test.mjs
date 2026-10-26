import test from "node:test";
import assert from "node:assert/strict";
import { createCurriculumRepository } from "../src/features/student/infrastructure/apiCurriculumRepository.js";
import { accessPayload } from "../src/features/student/domain/accessValidation.js";
import { presentJourney } from "../src/features/student/application/presentJourney.js";
import { selectJourneyItem, journeyReducer } from "../src/features/student/domain/journey.js";
import { safeExternalUrl } from "../src/shared/api/client.js";
const books = [{ id: "g12", grade: 12, semester: null, title: "كتاب الرياضيات", period_label: "كتاب كامل", classification_label: "العلمي والصناعي", source_url: "https://example.org/math12.pdf", units: [{ id: "u12", number_in_book: 1, title: "حساب التفاضل", lessons: [{ id: "l12", position: 1, title: "متوسط التغير" }] }] }];
const curriculum = createCurriculumRepository(books);
test("saved grade opens books; complete books preserve null semester and exact link", () => {
  let state = { grade: 12, semester: null, unit: null, lesson: null };
  assert.equal(presentJourney(state, curriculum).title, "الصف 12");
  assert.equal(presentJourney(state, curriculum).items[0].semester, null);
  assert.equal(selectJourneyItem(state, "g1", curriculum), state);
  state = selectJourneyItem(state, "g12", curriculum);
  assert.equal(presentJourney(state, curriculum).items.find(item => item.id === "@book").href, books[0].source_url);
  state = selectJourneyItem(state, "u12", curriculum); state = selectJourneyItem(state, "l12", curriculum);
  assert.deepEqual(presentJourney(state, curriculum).items.map(item => item.id), ["@book", "@learn", "@video", "@practice", "@game", "@completed"]);
  assert.deepEqual(journeyReducer(state, { type: "back" }), { ...state, lesson: null });
  assert.deepEqual(curriculum.listLessons(1, "g12", "u12"), []);
  assert.deepEqual(curriculum.listUnits(1, "g12"), []);
});
test("normalize username and digits without trimming passwords", () => {
  const data = { full_name: " طالب ", username: " STUDENT_1 ", password: " exact password ", grade: "12", identity_number: "١٢٣٤٥٦٧٨٩", phone: "٠٥٩ ١٢٣ ٤٥٦٧" };
  const payload = accessPayload("register", data);
  assert.equal(payload.username, "student_1"); assert.equal(payload.password, data.password); assert.equal(payload.grade, 12);
  assert.equal(payload.identity_number, "123456789"); assert.equal(payload.phone, "0591234567"); assert.equal(payload.email, null);
  assert(!("grade" in accessPayload("register", data, "parent")));
  assert.deepEqual(Object.keys(accessPayload("link", data)), ["username", "password"]);
});
test("external links reject script and insecure URLs", () => {
  assert.equal(safeExternalUrl("https://steam.ps/"), "https://steam.ps/");
  for (const value of ["javascript:alert(1)", "data:text/html,x", "http://example.org/a", undefined]) assert.equal(safeExternalUrl(value), null);
});
