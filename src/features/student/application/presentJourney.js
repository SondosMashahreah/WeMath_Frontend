import { GRADES, SEMESTERS } from "../domain/journey.js";

// View-model use case: no React, Three.js, DOM or concrete data dependency.
export function presentJourney(state, curriculum) {
  const breadcrumbs = [{ label: "الطالب", action: { type: "reset" } }];
  if (!state.grade) return {
    key: "grades", title: "الطالب", centerLines: ["الطالب"], hint: "اختر صفّك", breadcrumbs,
    items: GRADES.map(number => ({ id: String(number), label: `الصف ${number}`, number, kind: "grade", lines: [String(number)] })),
  };
  breadcrumbs.push({ label: `الصف ${state.grade}`, action: { type: "grade", value: state.grade } });
  if (!state.semester) return {
    key: `grade-${state.grade}`, title: `الصف ${state.grade}`, centerLines: ["الصف", String(state.grade)], hint: "اختر الفصل الدراسي", breadcrumbs,
    items: SEMESTERS.map(semester => ({ ...semester, id: String(semester.id), kind: "semester" })),
  };
  const semester = SEMESTERS.find(item => item.id === state.semester);
  breadcrumbs.push({ label: semester.label, action: { type: "semester", value: semester.id } });
  const units = curriculum.listUnits(state.grade, state.semester);
  if (!state.unit) return {
    key: `grade-${state.grade}-semester-${state.semester}`, title: semester.label, centerLines: semester.lines, hint: "اختر الوحدة", breadcrumbs,
    items: units.map(unit => ({ ...unit, kind: "unit", lines: ["الوحدة", String(unit.number)] })),
  };
  const unit = units.find(item => item.id === state.unit);
  breadcrumbs.push({ label: unit.label, action: { type: "unit", value: unit.id } });
  return {
    key: unit.id, title: unit.label, centerLines: ["الوحدة", String(unit.number)], hint: "اختر الدرس", breadcrumbs,
    items: curriculum.listLessons(state.grade, state.semester, unit.id).map(lesson => ({ ...lesson, kind: "lesson", lines: ["الدرس", String(lesson.number)] })),
  };
}
