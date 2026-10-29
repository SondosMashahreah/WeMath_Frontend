export const normalizeDigits = value => String(value || "").replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));
export const LOGIN_FIELDS = Object.freeze([
  { name: "username", label: "اسم المستخدم", autocomplete: "username", dir: "ltr", required: true, maxLength: 32 },
  { name: "password", label: "كلمة المرور", type: "password", autocomplete: "current-password", dir: "ltr", required: true, maxLength: 128 },
]);
export const REGISTRATION_FIELDS = Object.freeze([
  { name: "full_name", label: "الاسم الكامل", autocomplete: "name", required: true, maxLength: 150 },
  LOGIN_FIELDS[0], { ...LOGIN_FIELDS[1], autocomplete: "new-password", hint: "8 أحرف على الأقل" },
  { name: "grade", label: "الصف", type: "grade", required: true },
  { name: "track", label: "المسار", type: "track" },
  { name: "identity_number", label: "رقم الهوية", inputMode: "numeric", dir: "ltr", maxLength: 12 },
  { name: "school", label: "المدرسة", autocomplete: "organization", maxLength: 150 },
  { name: "phone", label: "الهاتف", type: "tel", dir: "ltr", autocomplete: "tel", maxLength: 20 },
  { name: "email", label: "البريد الإلكتروني", type: "email", dir: "ltr", autocomplete: "email", maxLength: 255 },
  { name: "directorate", label: "المديرية", maxLength: 150 },
]);
export function accessFields(mode, role = "student") {
  if (mode === "login" || mode === "link") return LOGIN_FIELDS;
  if (mode === "password") return [{ ...LOGIN_FIELDS[1], autocomplete: "new-password", hint: "8 أحرف على الأقل" }];
  if (mode === "changePassword") return [
    { name: "current_password", label: "كلمة المرور الحالية", type: "password", autocomplete: "current-password", dir: "ltr", required: true, maxLength: 128 },
    { name: "new_password", label: "كلمة المرور الجديدة", type: "password", autocomplete: "new-password", dir: "ltr", required: true, maxLength: 128, hint: "8 أحرف على الأقل" },
  ];
  if (mode === "profile" || mode === "edit") return REGISTRATION_FIELDS.filter(field => !["username", "password", "email"].includes(field.name));
  return REGISTRATION_FIELDS.filter(field => role === "student" || ["full_name", "username", "password", "email"].includes(field.name));
}
export function validateAccess(mode, values, role = "student") {
  const errors = {};
  for (const field of accessFields(mode, role)) if (field.required && !String(values[field.name] || "").trim()) errors[field.name] = `يرجى إدخال ${field.label}.`;
  if (!["login", "link"].includes(mode)) {
    if (values.username && !/^[a-zA-Z0-9_.-]{3,32}$/.test(values.username.trim())) errors.username = "3–32 حرفًا إنجليزيًا أو رقمًا، ويمكن استخدام . _ -";
    if (values.password && (values.password.length < 8 || values.password.length > 128)) errors.password = "كلمة المرور من 8 إلى 128 حرفًا.";
    if (values.full_name && values.full_name.trim().length < 2) errors.full_name = "يرجى إدخال الاسم كاملًا.";
    if (values.grade && (!Number.isInteger(Number(values.grade)) || Number(values.grade) < 1 || Number(values.grade) > 12)) errors.grade = "اختر صفًا من 1 إلى 12.";
    if ([11, 12].includes(Number(values.grade)) && !String(values.track || "").trim()) errors.track = "اختر مسارك الدراسي.";
    if (mode === "changePassword" && values.new_password && (values.new_password.length < 8 || values.new_password.length > 128)) errors.new_password = "كلمة المرور من 8 إلى 128 حرفًا.";
    if (values.identity_number && !/^\d{6,12}$/.test(normalizeDigits(values.identity_number.trim()))) errors.identity_number = "أدخل من 6 إلى 12 رقمًا.";
    if (values.phone && !/^\+?\d{7,15}$/.test(normalizeDigits(values.phone).replace(/[\s()-]/g, ""))) errors.phone = "يرجى إدخال رقم هاتف صحيح.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "يرجى إدخال بريد إلكتروني صحيح.";
  }
  return errors;
}
export function accessPayload(mode, values, role = "student") {
  const payload = Object.fromEntries(accessFields(mode, role).map(field => [field.name, field.type === "password" ? values[field.name] : String(values[field.name] || "").trim() || null]));
  if (payload.username) payload.username = payload.username.toLowerCase();
  if (payload.grade) payload.grade = Number(payload.grade);
  if (payload.identity_number) payload.identity_number = normalizeDigits(payload.identity_number);
  if (payload.phone) payload.phone = normalizeDigits(payload.phone).replace(/[\s()-]/g, "");
  if (mode === "register") payload.role = role;
  if (mode === "edit") payload.is_active = values.is_active !== false;
  return payload;
}
