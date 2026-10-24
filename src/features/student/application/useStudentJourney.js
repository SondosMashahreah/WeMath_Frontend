import { useCallback, useMemo, useState } from "react";
import { initialJourney, journeyReducer, selectJourneyItem } from "../domain/journey.js";
import { presentJourney } from "./presentJourney.js";

export function useStudentJourney(curriculum) {
  const [state, setState] = useState(initialJourney);
  const { grade, semester, unit } = state;
  const view = useMemo(() => presentJourney({ grade, semester, unit }, curriculum), [grade, semester, unit, curriculum]);
  const select = useCallback(id => setState(previous => selectJourneyItem(previous, id, curriculum)), [curriculum]);
  const navigate = useCallback(action => setState(previous => journeyReducer(previous, action)), []);
  return { state, view, select, navigate };
}
