import { Navigate, useLocation } from "react-router-dom";
import { useAccount } from "../../../account/application/accountContext.js";
import { useCurriculum } from "../../application/curriculumContext.js";
import StudentPortal from "../StudentPortal.jsx";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
export default function StudentPage({ account = false }) {
  const { profile, clear } = useAccount(), curriculum = useCurriculum(), location = useLocation(), { go } = usePageNavigation();
  const profileIncomplete = !profile.grade || [11, 12].includes(Number(profile.grade)) && !profile.track;
  if (profileIncomplete) return <Navigate replace to={`/student/profile?next=${encodeURIComponent(location.pathname + location.search)}`} />;
  if (!curriculum.repository) return <RouteFeedback title="المنهاج" message={curriculum.error?.message || "جاري تحميل المنهاج…"} retry={curriculum.error ? curriculum.retry : undefined} />;
  return <StudentPortal key={`${profile.id}-${profile.grade}-${profile.track || "common"}`} profile={profile} curriculum={curriculum.repository} accountOpen={account} onHome={() => go("/")} onLogout={() => {
    // Leave the protected route before clearing account state. Otherwise its
    // auth guard can race this navigation and send the user back to login.
    go("/", { replace: true, flushSync: true });
    clear();
  }} />;
}
