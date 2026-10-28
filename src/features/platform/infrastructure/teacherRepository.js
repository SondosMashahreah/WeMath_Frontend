import { request } from "./client.js";
export const teacherRepository = {
  save: (initial, payload, signal) => request(`/api/platform/teachers/documents${initial?.id ? `/${encodeURIComponent(initial.id)}` : ""}`, { method: initial?.id ? "PUT" : "POST", body: payload, teacher: true, signal }),
  archive: (id, version, archived, signal) => request(`/api/platform/teachers/documents/${encodeURIComponent(id)}/archive`, { method: "PATCH", teacher: true, signal, body: { version, archived } }),
};
