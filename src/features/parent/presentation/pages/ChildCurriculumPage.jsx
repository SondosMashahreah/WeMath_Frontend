import { Navigate, useParams } from "react-router-dom";
import { useFamily } from "../../application/familyContext.js";
import { useCurriculum } from "../../../student/application/curriculumContext.js";
import StudentPortal from "../../../student/presentation/StudentPortal.jsx";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
import { childPath } from "../../../../shared/routing/paths.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
export default function ChildCurriculumPage() {
  const { childId } = useParams(), { data } = useFamily(), curriculum = useCurriculum(), { go } = usePageNavigation();
  const child = data.children.find(entry => String(entry.id) === childId);
  if (!child) return <RouteFeedback back="/parent" message="حساب الطفل غير مرتبط بحسابك أو لم يعد متاحًا." />;
  if (!child.grade) return <Navigate replace to={childPath(childId, "edit")} />;
  if (!curriculum.repository) return <RouteFeedback title="المنهاج" message={curriculum.error?.message || "جاري تحميل المنهاج…"} retry={curriculum.error ? curriculum.retry : undefined} back={childPath(childId)} />;
  return <StudentPortal key={`${child.id}-${child.grade}`} curriculum={curriculum.repository} profile={child} readOnlyChildId={child.id} basePath={childPath(child.id, "curriculum")} onHome={() => go(childPath(child.id))} />;
}
