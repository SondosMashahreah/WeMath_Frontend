import { useMemoryState } from "../../../shared/state/memoryContext.js";
import { useTeacher } from "./teacherContext.js";
export function useDocumentDraft(kind, initial = {}) {
  const { user } = useTeacher();
  const key = `teacher:${user.id}:${kind}:${initial.id || `new-${initial.lesson_id || "blank"}`}`;
  const seed = { draft: { title: "", grade: 1, book_id: "", lesson_id: "", ...initial }, content: initial.content || (kind === "plan" ? { objectives: "", steps: "", assessment: "", materials: "", duration: 45 } : { instructions: "", questions: [{ prompt: "", options: ["", "", ""], correct: 0, explanation: "" }] }), version: initial.version || null };
  const [value, setValue, clear] = useMemoryState(key, seed);
  const field = name => next => setValue(previous => ({ ...previous, [name]: typeof next === "function" ? next(previous[name]) : next }));
  return { ...value, setDraft: field("draft"), setContent: field("content"), clear, reset: () => setValue(seed) };
}
