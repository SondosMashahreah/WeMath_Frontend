import { GRADES, SEMESTERS } from "../domain/journey.js";

// View-model use case: no React, Three.js, DOM or concrete data dependency.
export function presentJourney(state, curriculum) {
  const breadcrumbs = [{ label: "الطالب", action: { type: "reset" } }];
  if (!state.grade) return {
    key: "grades", title: "الطالب", centerLines: ["الطالب"], hint: "اختر صفّك", breadcrumbs,
    items: GRADES.map(number => ({ id: String(number), label: `الصف ${number}`, number, kind: "grade", lines: [String(number)] })),
  };
  breadcrumbs.push({ label: `الصف ${state.grade}`, action: { type: "grade", value: state.grade } });
  const books = curriculum.listBooks ? curriculum.listBooks(state.grade) : SEMESTERS;
  if (!state.semester) return {
    key: `grade-${state.grade}`, title: `الصف ${state.grade}`, centerLines: ["الصف", String(state.grade)], hint: "اختر الكتاب أو المسار", breadcrumbs,
    items: books.map(book => ({ ...book, id: String(book.id), kind: "semester", lines: book.lines || [book.label] })),
  };
  const semester = books.find(item => String(item.id) === String(state.semester));
  if (!semester) return {
    key: `grade-${state.grade}`, title: `الصف ${state.grade}`, centerLines: ["الصف", String(state.grade)], hint: "اختر الفصل أو المسار", breadcrumbs,
    items: books.map(book => ({ ...book, id: String(book.id), kind: "semester", lines: book.lines || [book.label] })),
  };
  breadcrumbs.push({ label: semester.label, action: { type: "semester", value: semester.id } });
  const units = curriculum.listUnits(state.grade, state.semester);
  if (!state.unit) return {
    key: `grade-${state.grade}-book-${state.semester}`, title: semester.label, centerLines: semester.lines || [semester.label], hint: "اختر الوحدة", breadcrumbs,
    items: [...units.map(unit => ({ ...unit, kind: "unit", lines: ["الوحدة", String(unit.number)], frontLines: ["الوحدة", String(unit.number)], backLines: [unit.label] })), ...(semester.sourceUrl ? [{ id: "@book", label: "فتح الكتاب", lines: ["الكتاب"], kind: "resource", href: semester.sourceUrl }] : [])],
  };
  const unit = units.find(item => item.id === state.unit);
  if (!unit) return {
    key: `grade-${state.grade}-book-${state.semester}`, title: semester.label, centerLines: semester.lines || [semester.label], hint: "اختر الوحدة", breadcrumbs,
    items: units.map(item => ({ ...item, kind: "unit", lines: ["الوحدة", String(item.number)], frontLines: ["الوحدة", String(item.number)], backLines: [item.label] })),
  };
  breadcrumbs.push({ label: unit.label, action: { type: "unit", value: unit.id } });
  const lessons = curriculum.listLessons(state.grade, state.semester, unit.id);
  const selectedLesson = lessons.find(item => item.id === state.lesson);
  if (selectedLesson) return {
    key: `lesson-${selectedLesson.id}`, title: selectedLesson.label, centerLines: [selectedLesson.label], hint: "اختر مورد الدرس", breadcrumbs,
    items: [
      ["quiz", "اختبار إلكتروني"],
      ["worksheet", "أوراق عمل إلكترونية"],
      ["film", "فلم"],
      ["activity", "أنشطة"],
      ["game", "ألعاب"],
      ["story_video", "القصة المروية أو الفيديو"],
    ].map(([id, label]) => ({ id: `@${id}`, label, lines: [label], kind: "resource" })),
  };
  return {
    key: selectedLesson ? `${unit.id}-${selectedLesson.id}` : unit.id,
    title: selectedLesson ? selectedLesson.label : unit.label,
    centerLines: selectedLesson ? [selectedLesson.label] : ["الوحدة", String(unit.number)],
    hint: selectedLesson ? `تم اختيار ${selectedLesson.label}` : "اختر الدرس",
    breadcrumbs,
    items: lessons.map(lesson => ({ ...lesson, kind: "lesson", lines: [lesson.label], frontLines: ["الدرس", String(lesson.number)], backLines: [lesson.label] })),
  };
}
