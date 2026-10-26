export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8100").replace(/\/$/, "");
const SESSION_KEY = "wemath.session.v1";
let memoryToken = null;
export function getToken() {
  if (memoryToken) return memoryToken;
  try { return globalThis.sessionStorage?.getItem(SESSION_KEY) || null; } catch { return null; }
}
export function setToken(token) {
  memoryToken = token;
  try { if (token) globalThis.sessionStorage?.setItem(SESSION_KEY, token); else globalThis.sessionStorage?.removeItem(SESSION_KEY); } catch { /* In-memory session still works when storage is blocked. */ }
}
export async function apiRequest(path, { method = "GET", body, signal, token = getToken(), auth = true } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method, signal,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("تعذّر الاتصال بالخادم. تحقق من الاتصال ثم حاول مجددًا.", { cause: error });
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 && auth && token === getToken()) {
      setToken(null);
      globalThis.window?.dispatchEvent(new Event("wemath:session-expired"));
    }
    const error = new Error(typeof payload.detail === "string" ? payload.detail : "يرجى مراجعة الحقول المطلوبة ثم إعادة المحاولة.");
    error.status = response.status; throw error;
  }
  return response.status === 204 ? null : response.json();
}
export function safeExternalUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : null; } catch { return null; }
}
