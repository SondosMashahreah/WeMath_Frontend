import { useState } from "react";
import { usePlatformData } from "../application/usePlatformData.js";
import { bookLabel, externalURL, hiveItem, PAGE_SIZE, pageControls } from "../domain/navigation.js";
import HivePage from "./HivePage.jsx";
import LoadDialog from "./LoadDialog.jsx";
import PlatformDialog from "./PlatformDialog.jsx";

export default function TeacherCurriculum({ onBack, onPrepare, onResources, onAssessment }) {
  const state = usePlatformData("/api/curriculum/catalog");
  const [grade, setGrade] = useState(null), [bookId, setBookId] = useState(null), [unitId, setUnitId] = useState(null), [lesson, setLesson] = useState(null), [offset, setOffset] = useState(0), [bookOpen, setBookOpen] = useState(false);
  if (!state.data) return <LoadDialog state={state} onClose={onBack} />;
  const books = state.data.books.filter(book => book.grade === grade), book = books.find(item => item.id === bookId), unit = book?.units.find(item => item.id === unitId);
  const sourceRows = unit ? unit.lessons.map(item => hiveItem(item.id, item.title)) : book ? book.units.map(item => hiveItem(item.id, item.title)) : grade ? books.map(item => hiveItem(item.id, bookLabel(item))) : Array.from({ length: 12 }, (_, i) => hiveItem(i + 1, `الصف ${i + 1}`, { kind: "grade", number: i + 1, lines: [String(i + 1)] }));
  const items = [...sourceRows.slice(offset, offset + PAGE_SIZE), ...pageControls(sourceRows.length, offset), ...(book ? [hiveItem("$book", "فتح الكتاب")] : [])];
  const back = () => { setOffset(0); if (unit) setUnitId(null); else if (book) setBookId(null); else if (grade) setGrade(null); else onBack(); };
  const select = id => {
    if (id === "$prev") return setOffset(v => v - PAGE_SIZE);
    if (id === "$next") return setOffset(v => v + PAGE_SIZE);
    if (id === "$book") return setBookOpen(true);
    setOffset(0); if (unit) setLesson(unit.lessons.find(item => item.id === id)); else if (book) setUnitId(id); else if (grade) setBookId(id); else setGrade(Number(id));
  };
  return <HivePage title={unit?.title || (book && bookLabel(book)) || (grade ? `الصف ${grade}` : "منهاج المعلّم")} items={items} onBack={back} onSelect={select}>
    {bookOpen && <PlatformDialog title={book.title} subtitle={bookLabel(book)} onClose={() => setBookOpen(false)}>{externalURL(book.source_url) ? <a className="student-primary-button" href={externalURL(book.source_url)} target="_blank" rel="noopener noreferrer">فتح الكتاب من المصدر ↗</a> : <p>رابط الكتاب غير متاح.</p>}</PlatformDialog>}
    {lesson && <PlatformDialog title={lesson.title} subtitle={`${unit.title} · الصف ${grade}`} onClose={() => setLesson(null)}>
      <div className="platform-actions"><button className="student-primary-button" onClick={() => onPrepare({ grade, book_id: book.id, lesson_id: lesson.id, title: `تحضير ${lesson.title}` })}>حضّر هذا الدرس</button><button className="student-secondary-button" onClick={onResources}>أنشطة وألعاب</button><button className="student-secondary-button" onClick={() => onAssessment({ grade, book_id: book.id, lesson_id: lesson.id, title: `اختبار ${lesson.title}` })}>أنشئ اختبارًا</button></div>
    </PlatformDialog>}
  </HivePage>;
}
