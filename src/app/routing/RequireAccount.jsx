import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAccount } from "../../features/account/application/accountContext.js";
import { canEnterPortal } from "../../features/account/domain/portalAccess.js";
import { useTeacher } from "../../features/platform/application/teacherContext.js";
import RouteFeedback from "../../shared/presentation/RouteFeedback.jsx";
export default function RequireAccount({ role }) {
  const account = useAccount(), teacher = useTeacher(), location = useLocation();
  const session = role === "teacher" ? teacher : account, profile = role === "teacher" ? teacher.user : account.profile;
  const root = role === "teacher" ? "/teachers" : `/${role}`;
  if (session.loading || session.error) return <RouteFeedback title="حسابك" message={session.error?.message || "جاري استعادة الجلسة…"} retry={session.error ? session.restore : undefined} />;
  if (role === "teacher" ? !profile : !canEnterPortal(profile, role)) return <Navigate replace to={`${root}/${role === "parent" ? "access" : "login"}?next=${encodeURIComponent(location.pathname + location.search)}`} />;
  return <Outlet />;
}
