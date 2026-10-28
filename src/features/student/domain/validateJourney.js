import { ACTIVITY_IDS } from "../../../shared/routing/paths.js";
export function validJourney(state, curriculum, activity) {
  if (state.semester && !curriculum.listBooks(state.grade).some(book => book.id === state.semester)) return false;
  if (state.unit && (!state.semester || !curriculum.listUnits(state.grade, state.semester).some(unit => unit.id === state.unit))) return false;
  if (state.lesson && (!state.unit || !curriculum.listLessons(state.grade, state.semester, state.unit).some(lesson => lesson.id === state.lesson))) return false;
  return !activity || Boolean(state.lesson) && ACTIVITY_IDS.includes(activity);
}
