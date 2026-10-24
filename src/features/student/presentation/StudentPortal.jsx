import { useCallback, useEffect, useRef } from "react";
import { useStudentJourney } from "../application/useStudentJourney.js";
import StudentHive from "./StudentHive.jsx";

export default function StudentPortal({ curriculum, onHome }) {
  const { state, view, select, navigate } = useStudentJourney(curriculum);
  const heading = useRef(null), scroll = useRef(null);
  const back = useCallback(() => { if (state.grade) navigate({ type: "back" }); else onHome(); }, [state.grade, navigate, onHome]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    scroll.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [view.key]);
  useEffect(() => {
    const onKey = event => { if (event.key === "Escape") { event.preventDefault(); back(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back]);
  const selected = view.items.find(item => item.id === state.lesson);
  return <main className="student-portal" dir="rtl" ref={scroll}>
    <h1 className="sr-only" ref={heading} tabIndex={-1}>{view.title} — {view.hint}</h1>
    <StudentHive view={view} selectedLesson={state.lesson} onSelect={select} onBack={back} />
    <p className="sr-only" role="status" aria-live="polite">{selected ? `تم اختيار ${selected.label}` : "اختر خلية للمتابعة، أو اضغط السداسي الكبير للرجوع."}</p>
  </main>;
}
