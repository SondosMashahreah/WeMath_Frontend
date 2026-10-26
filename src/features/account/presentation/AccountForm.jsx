import { useRef, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { accessFields, accessPayload, validateAccess } from "../../student/domain/accessValidation.js";
export default function AccountForm({ mode, role = "student", initialValues = {}, onSubmit, onComplete, submitLabel, compact = false }) {
  const [values, setValues] = useState(initialValues), [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false), [pending, setPending] = useState(false), [failure, setFailure] = useState("");
  const form = useRef(null);
  const fields = accessFields(mode, role).filter(field => !compact || field.required);
  async function submit(event) {
    event.preventDefault(); if (pending) return;
    const next = validateAccess(mode, values, role); setErrors(next); setFailure("");
    if (Object.keys(next).length) { requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus()); return; }
    setPending(true);
    try { const result = await onSubmit(accessPayload(mode, values, role)); onComplete?.(result); }
    catch (error) { setFailure(error.message); }
    finally { setPending(false); }
  }
  const update = (name, value) => { setValues(previous => ({ ...previous, [name]: value })); setErrors(previous => ({ ...previous, [name]: undefined })); };
  return <form ref={form} onSubmit={submit} noValidate className={`student-access-form ${["register", "profile", "edit"].includes(mode) ? "is-register" : ""}`} aria-busy={pending}>
    <fieldset disabled={pending} className="account-fieldset"><div className="student-fields">{fields.map(field => <div className="student-field" key={field.name}>
      <label htmlFor={`account-${field.name}`}>{field.label}{!field.required && <span className="optional-label"> · اختياري</span>}</label>
      <div className="student-input-wrap">
        {field.type === "grade" ? <select id={`account-${field.name}`} name={field.name} required value={values.grade || ""} aria-invalid={Boolean(errors.grade)} aria-describedby={errors.grade ? "grade-error" : undefined} onChange={event => update("grade", event.target.value)}>
          <option value="">اختر الصف</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>الصف {i + 1}</option>)}
        </select> : <input id={`account-${field.name}`} name={field.name} type={field.type === "password" && showPassword ? "text" : field.type || "text"}
          inputMode={field.inputMode} dir={field.dir || "rtl"} autoComplete={field.autocomplete || "off"} maxLength={field.maxLength || 150}
          required={field.required} value={values[field.name] || ""} aria-invalid={Boolean(errors[field.name])}
          aria-describedby={errors[field.name] ? `${field.name}-error` : field.hint ? `${field.name}-hint` : undefined} onChange={event => update(field.name, event.target.value)} />}
        {field.type === "password" && <button className="student-password-toggle" type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>}
      </div>
      {field.hint && <small id={`${field.name}-hint`} className="field-hint">{field.hint}</small>}{errors[field.name] && <span id={`${field.name}-error`} className="student-field-error">{errors[field.name]}</span>}
    </div>)}</div>
    {mode === "edit" && <label className="account-checkbox"><input name="is_active" type="checkbox" checked={values.is_active !== false} onChange={event => update("is_active", event.target.checked)} /> السماح للطفل بالدخول</label>}
    {failure && <p className="form-failure" role="alert">{failure}</p>}
    <button type="submit" className="student-primary-button">{pending ? "جاري الحفظ…" : submitLabel || (mode === "login" ? "دخول" : "حفظ ومتابعة")}</button></fieldset>
  </form>;
}
