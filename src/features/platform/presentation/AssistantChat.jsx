import { useAssistant } from "../application/useAssistant.js";
import { externalURL } from "../domain/navigation.js";
import PlatformDialog from "./PlatformDialog.jsx";
export default function AssistantChat({ mode, onClose }) {
  const { turns, busy, error, send } = useAssistant(mode);
  async function submit(event) {
    event.preventDefault(); const form = event.currentTarget, values = new FormData(form);
    if (await send(values.get("message"), values.get("grade"))) form.elements.message.value = "";
  }
  return <PlatformDialog title={mode === "calculate" ? "Algo — احسب معي" : "Algo — ابحث عن درس"} subtitle="نسخة تجريبية للحساب والبحث في الفهرس؛ لا يوجد نموذج ذكاء اصطناعي متصل." onClose={onClose} wide>
    <div className="platform-conversation" aria-live="polite">{turns.map((turn, index) => <article key={index}><p><strong>أنت:</strong> {turn.message}</p><p><strong>Algo:</strong> {turn.answer}</p>{turn.steps.length > 0 && <ol dir="ltr">{turn.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>}{turn.sources.map((source, i) => <p key={i}>{source.title} — الصف {source.grade} {externalURL(source.source_url) && <a href={externalURL(source.source_url)} target="_blank" rel="noopener noreferrer">فتح الكتاب ↗</a>}</p>)}</article>)}</div>
    <form className="platform-form" onSubmit={submit}>
      <label>{mode === "calculate" ? "العبارة الحسابية" : "عنوان الدرس"}<input name="message" required maxLength={500} placeholder={mode === "calculate" ? "(١٢ + ٨) ÷ ٤" : "الكسور"} autoFocus /></label>
      {mode !== "calculate" && <label>الصف<select name="grade"><option value="">كل الصفوف</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>}
      {error && <p role="alert">{error}</p>}<button className="student-primary-button" disabled={busy}>{busy ? "لحظة…" : "إرسال"}</button>
    </form>
  </PlatformDialog>;
}
