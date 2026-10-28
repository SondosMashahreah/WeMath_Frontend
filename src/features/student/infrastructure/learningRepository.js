import { apiRequest } from "../../../shared/api/client.js";
export const learningRepository = { record: (lessonId, activity, signal) => apiRequest(`/api/learning/lessons/${encodeURIComponent(lessonId)}/progress`, { method: "PUT", body: { activity }, signal }) };
