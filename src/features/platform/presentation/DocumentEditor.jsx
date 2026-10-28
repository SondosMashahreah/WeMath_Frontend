import { useEffect, useRef, useState } from "react";
import { useCurriculum } from "../../student/application/curriculumContext.js";
import { useDocumentDraft } from "../application/useDocumentDraft.js";
import { bookLabel } from "../domain/navigation.js";
import { teacherRepository } from "../infrastructure/teacherRepository.js";
import LoadDialog from "./LoadDialog.jsx";
import PlatformDialog from "./PlatformDialog.jsx";

const emptyQuestion = () => ({ prompt: "", options: ["", "", ""], correct: 0, explanation: "" });

function EditorForm({ catalog, kind, initial, onClose, onSaved }) {
  const { draft, setDraft, content, setContent, version, clear, reset } = useDocumentDraft(kind, initial);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  const books = catalog.books.filter(book => book.grade === Number(draft.grade));
  const book = books.find(book => book.id === draft.book_id), lessons = book?.units.flatMap(unit => unit.lessons) || [];
  const change = (key, value) => setDraft(previous => ({ ...previous, [key]: value, ...(key === "grade" ? { book_id: "", lesson_id: "" } : key === "book_id" ? { lesson_id: "" } : {}) }));
  const updateQuestion = (index, key, value) => setContent(previous => ({ ...previous, questions: previous.questions.map((question, i) => i === index ? { ...question, [key]: value } : question) }));
  async function save(event) {
    event.preventDefault(); if (busy) return;
    if (kind === "assessment" && content.questions.some(q => q.options.length < 2 || q.options.length > 6 || q.options.some(option => !option.trim()) || new Set(q.options.map(option => option.trim())).size !== q.options.length || q.correct >= q.options.length)) { setError("كل سؤال يحتاج خيارين إلى ستة خيارات مختلفة، وتحديد الإجابة الصحيحة."); return; }
    const abort = new AbortController(); controller.current = abort; setBusy(true); setError("");
    const payload = { kind, title: draft.title, grade: Number(draft.grade), book_id: draft.book_id || null, lesson_id: draft.lesson_id || null, content, ...(initial?.id ? { version } : {}) };
    try {
      const saved = await teacherRepository.save(initial, payload, abort.signal);
      clear();
      onSaved(saved);
    } catch (failure) { if (failure.name !== "AbortError") setError(failure.message); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }
  return <PlatformDialog title={`${initial?.id ? "تعديل" : "إنشاء"} ${kind === "plan" ? "تحضير درس" : "اختبار"}`} onClose={onClose} wide>
    <form className="platform-form" onSubmit={save}>
      <label>العنوان<input required minLength={2} maxLength={180} value={draft.title} onChange={e => change("title", e.target.value)} /></label>
      <label>الصف<select value={draft.grade} onChange={e => change("grade", Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
      <label>الكتاب{kind === "assessment" && " (اختياري)"}<select required={kind === "plan"} value={draft.book_id || ""} onChange={e => change("book_id", e.target.value)}><option value="">اختر الكتاب</option>{books.map(book => <option key={book.id} value={book.id}>{bookLabel(book)}</option>)}</select></label>
      <label>الدرس{kind === "assessment" && " (اختياري)"}<select required={kind === "plan"} disabled={!book} value={draft.lesson_id || ""} onChange={e => change("lesson_id", e.target.value)}><option value="">اختر الدرس</option>{lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label>
      {kind === "plan" ? <>
        <label>مدة الحصة بالدقائق<input type="number" min={5} max={180} required value={content.duration} onChange={e => setContent({ ...content, duration: Number(e.target.value) })} /></label>
        {[["objectives", "الأهداف", 4000], ["steps", "خطوات التنفيذ", 10000], ["assessment", "التقويم", 4000], ["materials", "الأدوات (اختياري)", 2000]].map(([key, label, max]) => <label key={key}>{label}<textarea required={key !== "materials"} rows={3} maxLength={max} value={content[key]} onChange={e => setContent({ ...content, [key]: e.target.value })} /></label>)}
      </> : <>
        <label>تعليمات الاختبار<textarea maxLength={2000} value={content.instructions} onChange={e => setContent({ ...content, instructions: e.target.value })} /></label>
        {content.questions.map((question, index) => <fieldset key={index}><legend>السؤال {index + 1}</legend>
          <label>نص السؤال<textarea required maxLength={1500} value={question.prompt} onChange={e => updateQuestion(index, "prompt", e.target.value)} /></label>
          <label>الخيارات — خيار في كل سطر<textarea required maxLength={3005} rows={4} value={question.options.join("\n")} onChange={e => updateQuestion(index, "options", e.target.value.split("\n"))} /></label>
          <label>الإجابة الصحيحة<select value={question.correct} onChange={e => updateQuestion(index, "correct", Number(e.target.value))}>{question.options.map((option, i) => <option key={i} value={i}>{i + 1}. {option.slice(0, 50) || "خيار فارغ"}</option>)}</select></label>
          <label>تفسير الإجابة (اختياري)<textarea maxLength={2000} value={question.explanation} onChange={e => updateQuestion(index, "explanation", e.target.value)} /></label>
          {content.questions.length > 1 && <button className="student-secondary-button" type="button" onClick={() => setContent({ ...content, questions: content.questions.filter((_, i) => i !== index) })}>حذف السؤال {index + 1}</button>}
        </fieldset>)}
        <button className="student-secondary-button" type="button" disabled={content.questions.length >= 30} onClick={() => setContent({ ...content, questions: [...content.questions, emptyQuestion()] })}>إضافة سؤال ({content.questions.length}/30)</button>
      </>}
      {error && <p role="alert">{error}</p>}<button className="student-primary-button" disabled={busy}>{busy ? "جاري الحفظ…" : "حفظ"}</button>
      <button className="student-secondary-button" type="button" disabled={busy} onClick={reset}>تجاهل المسودة والبدء من جديد</button>
    </form>
  </PlatformDialog>;
}

export default function DocumentEditor(props) {
  const state = useCurriculum();
  return state.catalog ? <EditorForm {...props} catalog={state.catalog} /> : <LoadDialog state={state} onClose={props.onClose} />;
}
