import { SEMESTERS } from "../domain/journey.js";

// Test/demo fixture implementing the same port as the real API repository.
export const previewCurriculumRepository = {
  listBooks() {
    return SEMESTERS.map(item => ({ ...item }));
  },
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
