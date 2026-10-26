import { useEffect, useRef, useState } from "react";
import { request } from "../infrastructure/client.js";
import { externalURL, hiveItem } from "../domain/navigation.js";
import HivePage from "./HivePage.jsx";
import PlatformDialog from "./PlatformDialog.jsx";

function Chat({ mode, onClose }) {
  const [turns, setTurns] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(event) {
    event.preventDefault(); const form = event.currentTarget, values = new FormData(form), message = values.get("message").trim();
    if (!message || busy) return;
    const abort = new AbortController(); controller.current = abort; setBusy(true); setError("");
    try {
      const answer = await request("/api/platform/assistant", { method: "POST", body: { message, grade: values.get("grade") ? Number(values.get("grade")) : null }, signal: abort.signal });
      setTurns(previous => [...previous, { message, ...answer }].slice(-6)); form.elements.message.value = "";
    } catch (failure) { if (failure.name !== "AbortError") setError(failure.message); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }
  return <PlatformDialog title={mode === "calculate" ? "Algo — احسب معي" : "Algo — ابحث عن درس"} subtitle="نسخة تجريبية للحساب والبحث في الفهرس؛ لا يوجد نموذج ذكاء اصطناعي متصل." onClose={onClose} wide>
    <div className="platform-conversation" aria-live="polite">{turns.map((turn, index) => <article key={index}><p><strong>أنت:</strong> {turn.message}</p><p><strong>Algo:</strong> {turn.answer}</p>{turn.steps.length > 0 && <ol dir="ltr">{turn.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>}{turn.sources.map((source, i) => <p key={i}>{source.title} — الصف {source.grade} {externalURL(source.source_url) && <a href={externalURL(source.source_url)} target="_blank" rel="noopener noreferrer">فتح الكتاب ↗</a>}</p>)}</article>)}</div>
    <form className="platform-form" onSubmit={send}>
      <label>{mode === "calculate" ? "العبارة الحسابية" : "عنوان الدرس"}<input name="message" required maxLength={500} placeholder={mode === "calculate" ? "(١٢ + ٨) ÷ ٤" : "الكسور"} autoFocus /></label>
      {mode !== "calculate" && <label>الصف<select name="grade"><option value="">كل الصفوف</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>}
      {error && <p role="alert">{error}</p>}<button className="student-primary-button" disabled={busy}>{busy ? "لحظة…" : "إرسال"}</button>
    </form>
  </PlatformDialog>;
}

export default function AssistantPortal({ onBack }) {
  const [mode, setMode] = useState(null);
  return <HivePage title="Algo" items={[hiveItem("calculate", "احسب معي"), hiveItem("search", "ابحث عن درس")]} onSelect={setMode} onBack={onBack}>
    {mode && <Chat mode={mode} onClose={() => setMode(null)} />}
  </HivePage>;
}
