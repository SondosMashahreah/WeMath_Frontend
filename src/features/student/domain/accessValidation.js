const digits = value => value.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));
export const REGISTRATION_FIELDS = Object.freeze([
  { name: "studentName", label: "اسم الطالب", autocomplete: "name" },
  { name: "identityNumber", label: "رقم الهوية", inputMode: "numeric", dir: "ltr", autocomplete: "off" },
  { name: "school", label: "المدرسة", autocomplete: "organization" },
  { name: "phone", label: "الهاتف", type: "tel", dir: "ltr", autocomplete: "tel" },
  { name: "email", label: "البريد الإلكتروني", type: "email", dir: "ltr", autocomplete: "email" },
  { name: "directorate", label: "المديرية", autocomplete: "off" },
]);
export function validateAccess(mode, values) {
  const fields = mode === "login" ? [
    { name: "username", label: "اسم المستخدم" }, { name: "password", label: "كلمة المرور" },
  ] : REGISTRATION_FIELDS;
  const errors = {};
  for (const field of fields) if (!values[field.name]?.trim()) errors[field.name] = `يرجى إدخال ${field.label}.`;
  if (mode === "register") {
    if (values.identityNumber && !/^\d{6,12}$/.test(digits(values.identityNumber.trim()))) errors.identityNumber = "أدخل رقم الهوية باستخدام 6 إلى 12 رقمًا.";
    if (values.phone && !/^\+?\d{7,15}$/.test(digits(values.phone).replace(/[\s()-]/g, ""))) errors.phone = "يرجى إدخال رقم هاتف صحيح.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "يرجى إدخال بريد إلكتروني صحيح.";
  }
  return errors;
}
