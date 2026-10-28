import { useParams, useSearchParams } from "react-router-dom";
import { usePlatformData } from "../../application/usePlatformData.js";
import { useCurriculum } from "../../../student/application/curriculumContext.js";
import { documentPath } from "../../../../shared/routing/paths.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
import LoadDialog from "../LoadDialog.jsx";
import DocumentEditor from "../DocumentEditor.jsx";
export default function TeacherDocumentEditorPage({ kind }) {
  const { documentId } = useParams(), [params] = useSearchParams(), { go, close } = usePageNavigation(), curriculum = useCurriculum();
  const state = usePlatformData(documentId ? `/api/platform/teachers/documents/${encodeURIComponent(documentId)}` : null, true);
  const base = documentPath(kind, documentId);
  if (documentId && !state.data) return <LoadDialog state={state} onClose={() => close(base)} />;
  if (!curriculum.catalog) return <LoadDialog state={curriculum} onClose={() => close(base)} />;
  if (state.data && (state.data.kind !== kind || state.data.archived)) return <RouteFeedback back={base} message="استعد الملف من الأرشيف أولًا، أو افتحه من القسم المناسب." />;
  let initial = state.data || {};
  if (!documentId && (params.has("book") || params.has("lesson") || params.has("grade"))) {
    const book = curriculum.catalog.books.find(book => book.id === params.get("book") && book.grade === Number(params.get("grade")));
    const lesson = book?.units.flatMap(unit => unit.lessons).find(lesson => lesson.id === params.get("lesson"));
    if (!book || !lesson) return <RouteFeedback back={documentPath(kind)} message="الكتاب أو الدرس المحدد في الرابط غير صالح." />;
    initial = { grade: book.grade, book_id: book.id, lesson_id: lesson.id, title: `${kind === "plan" ? "تحضير" : "اختبار"} ${lesson.title}` };
  }
  return <DocumentEditor key={`${kind}-${documentId || initial.lesson_id || "new"}`} kind={kind} initial={initial} onClose={() => close(base)} onSaved={saved => go(documentPath(kind, saved.id), { replace: true })} />;
}
