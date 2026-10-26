import { apiRequest } from "../../../shared/api/client.js";
export const familyRepository = {
  create: body => apiRequest("/api/parents/children", { method: "POST", body }),
  link: body => apiRequest("/api/parents/children/link", { method: "POST", body }),
  update: (id, body) => apiRequest(`/api/parents/children/${id}`, { method: "PATCH", body }),
  resetPassword: (id, body) => apiRequest(`/api/parents/children/${id}/password`, { method: "PUT", body }),
};
