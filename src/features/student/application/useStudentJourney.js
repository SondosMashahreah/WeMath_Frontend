import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { journeyReducer, selectJourneyItem } from "../domain/journey.js";
import { validJourney } from "../domain/validateJourney.js";
import { presentJourney } from "./presentJourney.js";
import { studentPath } from "../../../shared/routing/paths.js";
import { usePageNavigation } from "../../../shared/routing/usePageNavigation.js";
export function useStudentJourney(curriculum, grade, base = "/student") {
  const { bookId, unitId, lessonId, activity } = useParams(), { go } = usePageNavigation();
  const state = useMemo(() => ({ grade, semester: bookId || null, unit: unitId || null, lesson: lessonId || null }), [grade, bookId, unitId, lessonId]);
  const view = useMemo(() => presentJourney(state, curriculum), [state, curriculum]);
  const select = id => go(studentPath(selectJourneyItem(state, id, curriculum), base));
  const navigate = action => go(studentPath({ ...journeyReducer(state, action), grade }, base));
  return { state, view, select, navigate, activity, valid: validJourney(state, curriculum, activity) };
}
