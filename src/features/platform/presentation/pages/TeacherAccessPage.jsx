import { Navigate, useSearchParams } from "react-router-dom";
import { useTeacher } from "../../application/teacherContext.js";
import TeacherAuth from "../TeacherAuth.jsx";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
import { safeReturnPath } from "../../../../shared/routing/paths.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
export default function TeacherAccessPage({ mode }) {
  const session = useTeacher(), [params] = useSearchParams(), { go, close } = usePageNavigation();
  const next = safeReturnPath(params.get("next"), "/teachers");
  if (session.loading) return <RouteFeedback title="حسابك" message="جاري استعادة الجلسة…" />;
  if (session.user) return <Navigate replace to={next} />;
  return <TeacherAuth mode={mode} onModeChange={value => go(`/teachers/${value}?next=${encodeURIComponent(next)}`)} onClose={() => close("/")} onComplete={user => { session.accept(user); go(next, { replace: true }); }} />;
}
