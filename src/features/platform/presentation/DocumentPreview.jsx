import { useEffect, useRef, useState } from "react";
import { teacherRepository } from "../infrastructure/teacherRepository.js";
import PlatformDialog from "./PlatformDialog.jsx";
export default function DocumentPreview({ document, onClose, onEdit, onArchived }) {
  const [answers, setAnswers] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function archive() {
    if (busy) return;
    const abort = new AbortController(); controller.current = abort; setBusy(true); setError("");
    try { await teacherRepository.archive(document.id, document.version, !document.archived, abort.signal); onArchived(); }
    catch (failure) { if (failure.name !== "AbortError") setError(failure.message); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }
  return <PlatformDialog title={document.title} subtitle={`الصف ${document.grade}`} onClose={onClose} wide>
    <article className="platform-printable">
      <h2>{document.title}</h2><p>WE MATH · الصف {document.grade}</p>
      {document.kind === "plan" ? <><p>المدة: {document.content.duration} دقيقة</p>{[["objectives", "الأهداف"], ["steps", "خطوات التنفيذ"], ["assessment", "التقويم"], ["materials", "الأدوات"]].map(([key, title]) => <section key={key}><h3>{title}</h3><p className="platform-prose">{document.content[key] || "—"}</p></section>)}</> : <>
        <p>اسم الطالب: __________________</p><p className="platform-prose">{document.content.instructions}</p>
        {document.content.questions.map((q, index) => <section className="platform-print-question" key={index}><h3>{index + 1}. {q.prompt}</h3><ol>{q.options.map((option, i) => <li key={i}>{option}</li>)}</ol>{answers && <p className="platform-answer">الإجابة: {q.options[q.correct]}<br />{q.explanation}</p>}</section>)}
      </>}
    </article>
    <div className="platform-actions platform-no-print">
      {document.kind === "assessment" && <label className="platform-checkbox"><input type="checkbox" checked={answers} onChange={e => setAnswers(e.target.checked)} />إظهار نموذج الإجابة</label>}
      <button className="student-secondary-button" onClick={() => window.print()}>{answers ? "طباعة نموذج الإجابة" : document.kind === "assessment" ? "طباعة نسخة الطالب" : "طباعة التحضير"}</button>
      {!document.archived && <button className="student-primary-button" onClick={() => onEdit(document)}>تعديل</button>}
      <button className="student-secondary-button" disabled={busy} onClick={archive}>{busy ? "جاري الحفظ…" : document.archived ? "استعادة من الأرشيف" : "نقل إلى الأرشيف"}</button>
      {error && <p role="alert">{error}</p>}
    </div>
  </PlatformDialog>;
}
