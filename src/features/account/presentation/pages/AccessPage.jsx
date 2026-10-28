import { Navigate, useSearchParams } from "react-router-dom";
import { useAccount } from "../../application/accountContext.js";
import { canEnterPortal } from "../../domain/portalAccess.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
import { safeReturnPath } from "../../../../shared/routing/paths.js";
import StudentAccessDialog from "../../../student/presentation/StudentAccessDialog.jsx";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
export default function AccessPage({ role, mode }) {
  const account = useAccount(), [params] = useSearchParams(), { go, close } = usePageNavigation();
  const root = `/${role}`, next = safeReturnPath(params.get("next"), root);
  if (account.loading) return <RouteFeedback title="حسابك" message="جاري استعادة الجلسة…" />;
  if (canEnterPortal(account.profile, role)) return <Navigate replace to={next} />;
  const changeMode = value => go(`${root}/${value === "choice" ? "access" : value}?next=${encodeURIComponent(next)}`);
  return <StudentAccessDialog role={role} mode={mode} onModeChange={changeMode} onClose={() => close("/")} onComplete={profile => { account.accept(profile); go(next, { replace: true }); }} />;
}
