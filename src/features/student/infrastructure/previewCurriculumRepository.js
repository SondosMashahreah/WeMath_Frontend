// UI fixtures only, not the Palestinian curriculum. Replace this adapter
// with real grade/semester data when the content is supplied.
// Port: listUnits(grade, semester), listLessons(grade, semester, unitId).
export const previewCurriculumRepository = {
  listUnits(grade, semester) {
    return Array.from({ length: 6 }, (_, i) => ({
      id: `g${grade}-s${semester}-u${i + 1}`, number: i + 1, label: `الوحدة ${i + 1}`,
    }));
  },
  listLessons(grade, semester, unitId) {
    if (!this.listUnits(grade, semester).some(unit => unit.id === unitId)) return [];
    return Array.from({ length: 4 }, (_, i) => ({
      id: `${unitId}-l${i + 1}`, number: i + 1, label: `الدرس ${i + 1}`,
    }));
  },
};
