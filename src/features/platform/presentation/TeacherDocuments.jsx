import { useEffect, useRef, useState } from "react";
import { usePlatformData } from "../application/usePlatformData.js";
import { hiveItem, PAGE_SIZE, pageControls } from "../domain/navigation.js";
import { query, request } from "../infrastructure/client.js";
import HivePage from "./HivePage.jsx";
import LoadDialog from "./LoadDialog.jsx";
import PlatformDialog from "./PlatformDialog.jsx";

function Preview({ document, onClose, onEdit, onArchived }) {
  const [answers, setAnswers] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function archive() {
    if (busy) return;
    const abort = new AbortController(); controller.current = abort; setBusy(true); setError("");
    try { await request(`/api/platform/teachers/documents/${document.id}/archive`, { method: "PATCH", teacher: true, signal: abort.signal, body: { version: document.version, archived: !document.archived } }); onArchived(); }
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

export default function TeacherDocuments({ kind, onBack, onEdit }) {
  const [archived, setArchived] = useState(false), [offset, setOffset] = useState(0), [selected, setSelected] = useState(null);
  const state = usePlatformData(`/api/platform/teachers/documents?${query({ kind, archived, offset, limit: PAGE_SIZE })}`, true);
  if (!state.data) return <LoadDialog state={state} onClose={onBack} />;
  const items = [...state.data.items.map(doc => hiveItem(doc.id, doc.title)), hiveItem("$new", kind === "plan" ? "تحضير جديد" : "اختبار جديد"), hiveItem("$archive", archived ? "الملفات الحالية" : "الأرشيف"), ...pageControls(state.data.total, offset)];
  function select(id) {
    if (id === "$new") onEdit({});
    else if (id === "$archive") { setArchived(v => !v); setOffset(0); }
    else if (id === "$prev") setOffset(v => v - PAGE_SIZE);
    else if (id === "$next") setOffset(v => v + PAGE_SIZE);
    else setSelected(state.data.items.find(doc => String(doc.id) === id));
  }
  return <HivePage title={`${kind === "plan" ? "تحضيراتي" : "اختباراتي"}${archived ? " — الأرشيف" : ""}`} items={items} onSelect={select} onBack={onBack}>
    {!state.data.total && <p className="platform-status" role="status">{archived ? "الأرشيف فارغ" : "ابدأ بإنشاء أول ملف لك"}</p>}
    {selected && <Preview document={selected} onClose={() => setSelected(null)} onEdit={onEdit} onArchived={() => { setSelected(null); setOffset(0); state.retry(); }} />}
  </HivePage>;
}
