import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { journeyReducer, selectJourneyItem } from "../domain/journey.js";
import { validJourney } from "../domain/validateJourney.js";
import { presentJourney } from "./presentJourney.js";
import { studentPath } from "../../../shared/routing/paths.js";
import { usePageNavigation } from "../../../shared/routing/usePageNavigation.js";
export function useStudentJourney(curriculum, grade, track = null, base = "/student") {
  const { bookId, unitId, lessonId, activity } = useParams(), { go, location } = usePageNavigation();
  const scoped = useMemo(() => ({
    listBooks: value => curriculum.listBooks(value, track),
    listUnits: (...args) => curriculum.listUnits(...args),
    listLessons: (...args) => curriculum.listLessons(...args),
  }), [curriculum, track]);
  const state = useMemo(() => ({ grade, semester: bookId || null, unit: unitId || null, lesson: lessonId || null }), [grade, bookId, unitId, lessonId]);
  useEffect(() => {
    // Auto-open a sole book only at the curriculum root, never on /account.
    if (location.pathname.replace(/\/+$/, "") !== base || bookId || unitId || lessonId) return;
    const books = scoped.listBooks(grade);
    if (books.length === 1) go(studentPath({ grade, semester: books[0].id }, base), { replace: true });
  }, [bookId, unitId, lessonId, grade, scoped, base, go, location.pathname]);
  const view = useMemo(() => presentJourney(state, scoped), [state, scoped]);
  const select = id => go(studentPath(selectJourneyItem(state, id, scoped), base));
  const navigate = action => go(studentPath({ ...journeyReducer(state, action), grade }, base));
  return { state, view, select, navigate, activity, valid: validJourney(state, scoped, activity) };
}
