// Framework-free navigation rules. "semester" is kept as the persisted field
// name for UI compatibility, but it stores the selected curriculum book id.
export const initialJourney = Object.freeze({ grade: null, semester: null, unit: null, lesson: null });
export const GRADES = Object.freeze(Array.from({ length: 12 }, (_, i) => i + 1));
export const SEMESTERS = Object.freeze([
  { id: 1, label: "الفصل الأول", lines: ["الفصل", "الأول"] },
  { id: 2, label: "الفصل الثاني", lines: ["الفصل", "الثاني"] },
]);

export function journeyReducer(state, action) {
  switch (action.type) {
    case "grade":
      return GRADES.includes(action.value) ? { ...initialJourney, grade: action.value } : state;
    case "semester":
      return state.grade && action.value !== null && action.value !== undefined && action.value !== ""
        ? { ...state, semester: action.value, unit: null, lesson: null } : state;
    case "unit":
      return state.semester && action.value ? { ...state, unit: action.value, lesson: null } : state;
    case "lesson":
      return state.unit && action.value ? { ...state, lesson: action.value } : state;
    case "back":
      if (state.lesson) return { ...state, lesson: null };
      if (state.unit) return { ...state, unit: null, lesson: null };
      if (state.semester) return { ...state, semester: null, unit: null, lesson: null };
      if (state.grade) return { ...initialJourney };
      return state;
    case "reset": return { ...initialJourney };
    default: return state;
  }
}

export function selectJourneyItem(state, itemId, curriculum) {
  if (!state.grade) return journeyReducer(state, { type: "grade", value: Number(itemId) });
  if (!state.semester) {
    const choices = curriculum.listBooks ? curriculum.listBooks(state.grade) : SEMESTERS;
    const choice = choices.find(item => String(item.id) === String(itemId));
    return choice ? journeyReducer(state, { type: "semester", value: choice.id }) : state;
  }
  if (!state.unit) {
    const unit = curriculum.listUnits(state.grade, state.semester).find(item => item.id === itemId);
    return unit ? journeyReducer(state, { type: "unit", value: unit.id }) : state;
  }
  const lesson = curriculum.listLessons(state.grade, state.semester, state.unit).find(item => item.id === itemId);
  return lesson ? journeyReducer(state, { type: "lesson", value: lesson.id }) : state;
}
