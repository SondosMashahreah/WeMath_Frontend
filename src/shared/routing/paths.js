// Pure URL contracts. No React, network or user credentials.
const segment = value => encodeURIComponent(String(value));
export const HOME_PATHS = Object.freeze({ students: "/student", parents: "/parent", teachers: "/teachers", workshops: "/workshops", competitions: "/competitions", initiatives: "/initiatives", assistant: "/assistant" });
export const ACTIVITY_IDS = Object.freeze(["quiz", "worksheet", "film", "activity", "game", "story_video"]);
export function studentPath({ semester, unit, lesson, activity } = {}, base = "/student") {
  let path = base;
  if (semester) path += `/books/${segment(semester)}`;
  if (semester && unit) path += `/units/${segment(unit)}`;
  if (semester && unit && lesson) path += `/lessons/${segment(lesson)}`;
  if (semester && unit && lesson && activity) path += `/activities/${segment(activity)}`;
  return path;
}
export function teacherCurriculumPath({ grade, bookId, unitId, lessonId } = {}) {
  let path = "/teachers/curriculum";
  if (grade) path += `/grades/${segment(grade)}`;
  if (grade && bookId) path += `/books/${segment(bookId)}`;
  if (grade && bookId && unitId) path += `/units/${segment(unitId)}`;
  if (grade && bookId && unitId && lessonId) path += `/lessons/${segment(lessonId)}`;
  return path;
}
export function contentPath(base, category, entryId) { return `${base}${category ? `/${segment(category)}` : ""}${category && entryId ? `/${segment(entryId)}` : ""}`; }
export function childPath(id, page = "") { return `/parent/children/${segment(id)}${page ? `/${page}` : ""}`; }
export function documentPath(kind, id, edit = false) { return `/teachers/${kind === "plan" ? "plans" : "assessments"}${id ? `/${segment(id)}` : ""}${edit ? "/edit" : ""}`; }
export function safeReturnPath(value, root) {
  if (typeof value !== "string" || !value.startsWith(`${root}/`) && value !== root || value.startsWith("//")) return root;
  try {
    const url = new URL(value, "https://wemath.invalid");
    if (url.origin !== "https://wemath.invalid" || url.pathname !== root && !url.pathname.startsWith(`${root}/`) || /\/(login|register|access)$/.test(url.pathname)) return root;
    return `${url.pathname}${url.search}`;
  } catch { return root; }
}
export function readListQuery(search) {
  const params = new URLSearchParams(search), value = Number(params.get("page"));
  return { page: Number.isSafeInteger(value) && value > 0 && value <= 10000 ? value : 1, q: (params.get("q") || "").slice(0, 100), archived: params.get("archived") === "1", month: /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(params.get("month") || "") ? params.get("month") : "", panel: ["search", "calendar"].includes(params.get("panel")) ? params.get("panel") : null };
}
