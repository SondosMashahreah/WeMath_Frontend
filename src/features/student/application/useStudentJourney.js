import { useCallback, useMemo, useState } from "react";
import { initialJourney, journeyReducer, selectJourneyItem } from "../domain/journey.js";
import { presentJourney } from "./presentJourney.js";

export function useStudentJourney(curriculum, grade) {
  const [state, setState] = useState(() => ({ ...initialJourney, grade }));
  const { semester, unit, lesson } = state;
  const view = useMemo(() => presentJourney({ grade, semester, unit, lesson }, curriculum), [grade, semester, unit, lesson, curriculum]);
  const select = useCallback(id => setState(previous => selectJourneyItem(previous, id, curriculum)), [curriculum]);
  const navigate = useCallback(action => setState(previous => ({ ...journeyReducer(previous, action), grade })), [grade]);
  return { state, view, select, navigate };
}
