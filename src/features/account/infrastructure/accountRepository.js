import { apiRequest, getToken, setToken } from "../../../shared/api/client.js";
import { assertPortalAccess } from "../domain/portalAccess.js";

function acceptSession(session, profile, role, signal) {
  signal?.throwIfAborted();
  assertPortalAccess(profile, role);
  setToken(session.access_token);
  return profile;
}

export const accountRepository = {
  async login(values, { role = "student", signal } = {}) {
    const session = await apiRequest("/api/auth/login", { method: "POST", body: values, auth: false, signal });
    const profile = session.user || await apiRequest("/api/auth/me", { token: session.access_token, signal });
    return acceptSession(session, profile, role, signal);
  },
  async register(values, { signal } = {}) {
    const session = await apiRequest("/api/auth/register", { method: "POST", body: values, auth: false, signal });
    return acceptSession(session, session.user, values.role, signal);
  },
  async restore(signal) { return getToken() ? apiRequest("/api/auth/me", { signal }) : null; },
  clearSession() { setToken(null); },
  completeProfile: body => apiRequest("/api/auth/me/profile", { method: "PATCH", body }),
  async changePassword(body) {
    const session = await apiRequest("/api/auth/me/password", { method: "PUT", body });
    setToken(session.access_token);
    return session.user;
  },
  async logout() {
    try { if (getToken()) await apiRequest("/api/auth/logout", { method: "POST" }); }
    finally { setToken(null); }
  },
};
