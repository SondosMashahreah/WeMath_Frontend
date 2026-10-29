export const EXTENSION_IDS = new Set(["teachers", "guest", "workshops", "competitions", "initiatives", "research", "assistant"]);
export const PAGE_SIZE = 6;
export const TITLES = { teachers: "المعلّم", guest: "الزائر", workshops: "الورشات", competitions: "المسابقات", initiatives: "المبادرات وقصص النجاح", research: "الأبحاث والدراسات", assistant: "Algo", teacher_resources: "موارد المعلّم" };
export const CATEGORIES = {
  workshops: { scientific: "ورش عالمية", universities: "جامعات ومؤسسات", directorates: "مديريات التربية" },
  competitions: { scientific: "محلية", international: "عالمية" },
  initiatives: { schools: "مبادرات المدارس", directorates: "مبادرات المديريات", teachers: "مبادرات المعلمين", students: "مبادرات الطلاب", teacher_stories: "قصص نجاح المعلمين", student_stories: "قصص نجاح الطلاب", school_stories: "قصص نجاح المدارس" },
  teacher_resources: { activities: "أنشطة وألعاب", questions: "بنك الأسئلة", preparation: "نماذج تحضير" },
};
export function hiveItem(id, label, extra = {}) {
  const display = label.length > 48 ? `${label.slice(0, 46)}…` : label;
  return { id: String(id), label, lines: [display], kind: "platform", ...extra };
}
export function externalURL(value) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function bookLabel(book) { return [book.classification_label, book.period_label].filter(Boolean).join(" — ") || book.title; }
export function pageControls(total, offset) {
  return [...(offset ? [hiveItem("$prev", "السابق")] : []), ...(offset + PAGE_SIZE < total ? [hiveItem("$next", "التالي")] : [])];
}
