import { useParams } from "react-router-dom";
import { useCurriculum } from "../../../student/application/curriculumContext.js";
import { bookLabel, externalURL, hiveItem, PAGE_SIZE, pageControls } from "../../domain/navigation.js";
import { query } from "../../infrastructure/client.js";
import { readListQuery, teacherCurriculumPath, documentPath } from "../../../../shared/routing/paths.js";
import { usePageNavigation, useQueryNavigation } from "../../../../shared/routing/usePageNavigation.js";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
import HivePage from "../HivePage.jsx";
import LoadDialog from "../LoadDialog.jsx";
import PlatformDialog from "../PlatformDialog.jsx";
export default function TeacherCurriculumPage() {
  const state = useCurriculum(), params = useParams(), { go, close, location } = usePageNavigation(), search = useQueryNavigation();
  const { grade: gradeId, bookId, unitId, lessonId } = params, grade = Number(gradeId), page = readListQuery(location.search).page, offset = (page - 1) * PAGE_SIZE;
  if (!state.catalog) return <LoadDialog state={state} onClose={() => go("/teachers")} />;
  const books = state.catalog.books.filter(book => book.grade === grade), book = books.find(item => item.id === bookId), unit = book?.units.find(item => item.id === unitId), lesson = unit?.lessons.find(item => item.id === lessonId);
  if (gradeId && (!Number.isInteger(grade) || !books.length) || bookId && !book || unitId && !unit || lessonId && !lesson) return <RouteFeedback back="/teachers/curriculum" />;
  const rows = unit ? unit.lessons.map(item => hiveItem(item.id, item.title)) : book ? book.units.map(item => hiveItem(item.id, item.title)) : gradeId ? books.map(item => hiveItem(item.id, bookLabel(item))) : Array.from({ length: 12 }, (_, i) => hiveItem(i + 1, `الصف ${i + 1}`, { kind: "grade", number: i + 1, lines: [String(i + 1)] }));
  const items = [...rows.slice(offset, offset + PAGE_SIZE), ...pageControls(rows.length, offset), ...(book ? [hiveItem("$book", "فتح الكتاب")] : [])];
  function select(id) {
    if (id === "$prev") return search.update({ page: page - 1 });
    if (id === "$next") return search.update({ page: page + 1 });
    if (id === "$book") return search.update({ panel: "book" });
    go(teacherCurriculumPath(unit ? { ...params, lessonId: id } : book ? { ...params, unitId: id } : gradeId ? { ...params, bookId: id } : { grade: id }));
  }
  const back = () => go(lesson ? teacherCurriculumPath({ ...params, lessonId: null }) : unit ? teacherCurriculumPath({ ...params, unitId: null }) : book ? teacherCurriculumPath({ grade }) : gradeId ? "/teachers/curriculum" : "/teachers");
  const newDocument = kind => go(`${documentPath(kind, "new")}?${query({ grade, book: book.id, lesson: lesson.id })}`);
  return <HivePage title={unit?.title || (book && bookLabel(book)) || (gradeId ? `الصف ${grade}` : "منهاج المعلّم")} items={items} onBack={back} onSelect={select}>
    {book && search.params.get("panel") === "book" && <PlatformDialog title={book.title} subtitle={bookLabel(book)} onClose={() => search.update({ panel: null }, true)}>{externalURL(book.source_url) ? <a className="student-primary-button" href={externalURL(book.source_url)} target="_blank" rel="noopener noreferrer">فتح الكتاب من المصدر ↗</a> : <p>رابط الكتاب غير متاح.</p>}</PlatformDialog>}
    {lesson && <PlatformDialog title={lesson.title} subtitle={`${unit.title} · الصف ${grade}`} onClose={() => close(teacherCurriculumPath({ ...params, lessonId: null }))}>
      <div className="platform-actions"><button className="student-primary-button" onClick={() => newDocument("plan")}>حضّر هذا الدرس</button><button className="student-secondary-button" onClick={() => go("/teachers/resources/activities")}>أنشطة وألعاب</button><button className="student-secondary-button" onClick={() => newDocument("assessment")}>أنشئ اختبارًا</button></div>
    </PlatformDialog>}
  </HivePage>;
}
