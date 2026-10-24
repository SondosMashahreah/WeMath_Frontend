import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaEye, FaEyeSlash, FaUserGraduate, FaXmark } from "react-icons/fa6";
import { REGISTRATION_FIELDS, validateAccess } from "../domain/accessValidation.js";

function AccessForm({ mode, onComplete }) {
  const [values, setValues] = useState({}), [errors, setErrors] = useState({}), [showPassword, setShowPassword] = useState(false);
  const form = useRef(null);
  const fields = mode === "login" ? [
    { name: "username", label: "اسم المستخدم", autocomplete: "username", dir: "auto" },
    { name: "password", label: "كلمة المرور", type: "password", autocomplete: "current-password", dir: "ltr" },
  ] : REGISTRATION_FIELDS;
  function submit(event) {
    event.preventDefault();
    const nextErrors = validateAccess(mode, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    // Prototype entry, not authentication. Credentials and registration fields
    // are never sent, persisted, logged or passed to the curriculum/scene.
    const name = (mode === "login" ? values.username : values.studentName).trim();
    setValues({});
    onComplete({ name });
  }
  return <form ref={form} onSubmit={submit} noValidate className={`student-access-form ${mode === "register" ? "is-register" : ""}`}>
    <div className="student-fields">
      {fields.map(field => <div className="student-field" key={field.name}>
        <label htmlFor={`student-${field.name}`}>{field.label}</label>
        <div className="student-input-wrap">
          <input id={`student-${field.name}`} name={field.name}
            type={field.type === "password" && showPassword ? "text" : field.type || "text"}
            inputMode={field.inputMode} dir={field.dir || "rtl"} autoComplete={field.autocomplete}
            maxLength={field.name === "password" ? 128 : 100} required value={values[field.name] || ""}
            aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
            onChange={event => { setValues(previous => ({ ...previous, [field.name]: event.target.value })); setErrors(previous => ({ ...previous, [field.name]: undefined })); }} />
          {field.type === "password" && <button className="student-password-toggle" type="button"
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={showPassword}
            onClick={() => setShowPassword(value => !value)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>}
        </div>
        {errors[field.name] && <span id={`${field.name}-error`} className="student-field-error">{errors[field.name]}</span>}
      </div>)}
    </div>
    {Object.values(errors).some(Boolean) && <p className="sr-only" role="alert">يرجى مراجعة الحقول الموضّحة قبل المتابعة.</p>}
    <button type="submit" className="student-primary-button">{mode === "login" ? "دخول" : "إنشاء حساب"}<span aria-hidden="true">←</span></button>
    <p className="student-preview-note">وضع المعاينة · لا تُرسل البيانات ولا يُنشأ حساب فعلي.</p>
  </form>;
}

export default function StudentAccessDialog({ onClose, onComplete }) {
  const dialog = useRef(null), heading = useRef(null);
  const [mode, setMode] = useState("choice");
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  function changeMode(next) { setMode(next); requestAnimationFrame(() => heading.current?.focus()); }
  return <dialog ref={dialog} className={`student-access-dialog student-access-${mode}`} dir="rtl" aria-labelledby="student-access-title"
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <section className="student-access-shell">
      <button className="student-dialog-close student-icon-button" type="button" aria-label="إغلاق" onClick={onClose}><FaXmark /></button>
      {mode !== "choice" && <button className="student-access-back student-icon-button" type="button" aria-label="رجوع إلى خيارات الدخول" onClick={() => changeMode("choice")}><FaArrowRight /></button>}
      <div className="student-access-heading">
        <span className="student-access-mark"><FaUserGraduate aria-hidden="true" /></span>
        <span className="student-eyebrow">مساحة الطالب</span>
        <h2 id="student-access-title" tabIndex={-1} ref={heading}>{mode === "choice" ? "رحلتك تبدأ من هنا" : mode === "login" ? "أهلًا بعودتك" : "أهلًا بك في WE MATH"}</h2>
        <p>{mode === "choice" ? "ادخل إلى حسابك، أو انضم إلينا." : mode === "login" ? "سجّل دخولك واختر صفّك." : "أكمل بياناتك لتبدأ رحلتك."}</p>
      </div>
      {mode === "choice" ? <div className="student-access-choices">
        <button className="student-primary-button" onClick={() => changeMode("login")}>تسجيل الدخول <span aria-hidden="true">←</span></button>
        <button className="student-secondary-button" onClick={() => changeMode("register")}>إنشاء حساب</button>
      </div> : <>
        <AccessForm key={mode} mode={mode} onComplete={onComplete} />
        <p className="student-switch-access">{mode === "login" ? "ليس لديك حساب؟" : "لديك حساب؟"} <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "إنشاء حساب" : "تسجيل الدخول"}</button></p>
      </>}
    </section>
  </dialog>;
}
