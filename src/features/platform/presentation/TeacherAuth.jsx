import { useEffect, useRef, useState } from "react";
import { teacherAccess } from "../infrastructure/client.js";
import PlatformDialog from "./PlatformDialog.jsx";

export default function TeacherAuth({ mode = "login", onModeChange, onComplete, onClose }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), [mode]);
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const abort = new AbortController(); controller.current = abort; setBusy(true); setError("");
    try { const user = await teacherAccess(mode, body, abort.signal); onComplete(user); }
    catch (failure) { if (failure.name !== "AbortError") setError(failure.message); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }
  return <PlatformDialog title={mode === "login" ? "دخول المعلّم" : "إنشاء حساب معلّم"} subtitle="مساحتك للتحضير والأنشطة والاختبارات." onClose={onClose}>
    <form className="platform-form" key={mode} onSubmit={submit}>
      {mode === "register" && <label>الاسم الكامل<input name="full_name" required minLength={2} maxLength={150} autoComplete="name" /></label>}
      <label>اسم المستخدم<input name="username" dir="ltr" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_.\-]+" autoComplete="username" title="3–32 حرفًا إنجليزيًا أو رقمًا، ويمكن استخدام النقطة والشرطة والشرطة السفلية" /></label>
      <label>كلمة المرور<input name="password" type="password" dir="ltr" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
      {mode === "register" && <label>المدرسة (اختياري)<input name="school" maxLength={150} /></label>}
      {error && <p role="alert">{error}</p>}
      <button className="student-primary-button" disabled={busy}>{busy ? "جاري المتابعة…" : mode === "login" ? "دخول" : "إنشاء حساب"}</button>
      <button className="student-secondary-button" type="button" disabled={busy} onClick={() => { onModeChange(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "إنشاء حساب معلّم" : "لدي حساب — تسجيل الدخول"}</button>
    </form>
  </PlatformDialog>;
}
