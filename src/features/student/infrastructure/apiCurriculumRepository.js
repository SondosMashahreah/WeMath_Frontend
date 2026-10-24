const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8100").replace(/\/$/, "");

function bookLabel(book) {
  const parts = [];
  if (book.classification_label) parts.push(book.classification_label);
  if (book.period_label && (book.period_label !== "كتاب كامل" || !book.classification_label)) parts.push(book.period_label);
  return parts.join(" — ") || book.title;
}

function bookLines(book) {
  const lines = [];
  if (book.classification_label) lines.push(book.classification_label);
  if (book.period_label && (book.period_label !== "كتاب كامل" || !book.classification_label)) lines.push(book.period_label);
  return lines.length ? lines : [book.title];
}

export async function loadCurriculumRepository({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/api/curriculum/catalog`, { signal });
  if (!response.ok) throw new Error(`Curriculum request failed: ${response.status}`);
  const payload = await response.json();
  const books = payload.books || [];
  const booksById = new Map(books.map(book => [book.id, book]));
  const unitsById = new Map();
  for (const book of books) for (const unit of book.units || []) unitsById.set(unit.id, unit);

  return {
    listBooks(grade) {
      return books
        .filter(book => book.grade === Number(grade))
        .map(book => ({
          id: book.id,
          label: bookLabel(book),
          lines: bookLines(book),
          semester: book.semester,
          classificationLabel: book.classification_label,
        }));
    },
    listUnits(_grade, bookId) {
      const book = booksById.get(String(bookId));
      return (book?.units || []).map(unit => ({
        id: unit.id,
        number: unit.number_in_book,
        label: unit.title,
      }));
    },
    listLessons(_grade, _bookId, unitId) {
      const unit = unitsById.get(String(unitId));
      return (unit?.lessons || []).map(lesson => ({
        id: lesson.id,
        number: lesson.position,
        label: lesson.title,
      }));
    },
  };
}
