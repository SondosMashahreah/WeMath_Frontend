import { API_BASE_URL } from '../../shared/api/client.js';
const KEY = 'wemath.cms.session.v1';
export const getAdminToken = () => sessionStorage.getItem(KEY);
export const setAdminToken = value => value ? sessionStorage.setItem(KEY, value) : sessionStorage.removeItem(KEY);
export async function cmsRequest(path, { method = 'GET', body, token = getAdminToken(), signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { method, signal,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && token === getAdminToken()) { setAdminToken(null); window.dispatchEvent(new Event('cms-expired')); }
    const message = Array.isArray(data.detail) ? data.detail.map(e => `${e.loc?.slice(1).join(' / ')}: ${e.msg}`).join('\n') : data.detail;
    throw new Error(message || 'تعذّر إتمام العملية');
  }
  return data;
}
export function download(name, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
