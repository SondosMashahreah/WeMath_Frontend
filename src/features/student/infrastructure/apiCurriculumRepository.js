import { apiRequest, safeExternalUrl } from "../../../shared/api/client.js";
function bookLines(book) {
  const lines = [];
  if (book.classification_label) lines.push(book.classification_label);
  if (book.period_label && (book.period_label !== "كتاب كامل" || !book.classification_label)) lines.push(book.period_label);
  return lines.length ? lines : [book.title];
}
export function createCurriculumRepository(books) {
  const byId = new Map(books.map(book => [book.id, book]));
  return {
    listTracks(grade) { return [...new Set(books.filter(book => book.grade === Number(grade)).map(book => book.classification_label).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar")); },
    listBooks(grade, track = null) { return books.filter(book => book.grade === Number(grade) && (!track || !book.classification_label || book.classification_label === track)).map(book => ({ id: book.id, label: bookLines(book).join(" — "), lines: bookLines(book), semester: book.semester, classificationLabel: book.classification_label, sourceUrl: safeExternalUrl(book.source_url), title: book.title })); },
    getBook(bookId) { const book = byId.get(String(bookId)); return book ? { ...book, sourceUrl: safeExternalUrl(book.source_url) } : null; },
    listUnits(grade, bookId) {
      const book = byId.get(String(bookId));
      return book?.grade === Number(grade) ? (book.units || []).map(unit => ({ id: unit.id, number: unit.number_in_book, label: unit.title })) : [];
    },
    listLessons(grade, bookId, unitId) {
      const book = byId.get(String(bookId)); if (book?.grade !== Number(grade)) return [];
      return (book.units?.find(unit => unit.id === unitId)?.lessons || []).map(lesson => ({ id: lesson.id, number: lesson.position, label: lesson.title }));
    },
  };
}
export async function loadCurriculumRepository({ signal } = {}) {
  const payload = await apiRequest("/api/curriculum/catalog", { signal, auth: false });
  if (!Array.isArray(payload.books) || !payload.books.length) throw new Error("المنهاج غير متاح بعد. يرجى تهيئة بيانات الكتب في الخادم.");
  return createCurriculumRepository(payload.books);
}
