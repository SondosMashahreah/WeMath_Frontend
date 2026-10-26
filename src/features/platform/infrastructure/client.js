const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8100").replace(/\/$/, "");
export const TEACHER_SESSION_KEY = "wemath.teacher.session.v1";
export function teacherToken() { try { return sessionStorage.getItem(TEACHER_SESSION_KEY) || ""; } catch { return ""; } }
export function setTeacherToken(token) { try { if (token) sessionStorage.setItem(TEACHER_SESSION_KEY, token); else sessionStorage.removeItem(TEACHER_SESSION_KEY); } catch { /* Private storage may be unavailable. */ } }
export function query(values) { return new URLSearchParams(Object.entries(values).filter(([, v]) => v !== null && v !== undefined && v !== "")).toString(); }

export async function request(path, { method = "GET", body, teacher = false, signal } = {}) {
  const token = teacher ? teacherToken() : "";
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method, signal, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("تعذّر الاتصال بالخادم. تأكد من تشغيل الباك ثم أعد المحاولة.", { cause: error });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && teacher && token === teacherToken()) {
      setTeacherToken(""); window.dispatchEvent(new Event("wemath:teacher-expired"));
    }
    const detail = typeof data.detail === "string" ? data.detail : response.status === 422 ? "راجع الحقول المطلوبة وصحة الخيارات قبل الحفظ." : "تعذّر إتمام الطلب. حاول مجددًا.";
    throw new Error(detail);
  }
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return data;
}
export async function teacherAccess(mode, body, signal) {
  const data = await request(`/api/platform/teachers/${mode}`, { method: "POST", body, signal });
  if (data.user?.role !== "teacher" || !data.access_token) throw new Error("لم يُرجع الخادم حساب معلّم صالحًا.");
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  setTeacherToken(data.access_token);
  return data.user;
}
export async function teacherLogout() {
  const token = teacherToken();
  try { await request("/api/platform/teachers/logout", { method: "POST", teacher: true }); }
  finally { if (token === teacherToken()) setTeacherToken(""); }
}
