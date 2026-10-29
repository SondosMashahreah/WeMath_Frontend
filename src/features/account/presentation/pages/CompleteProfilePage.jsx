import { Navigate, useSearchParams } from "react-router-dom";
import { useAccount } from "../../application/accountContext.js";
import { accountRepository } from "../../infrastructure/accountRepository.js";
import AccountForm from "../AccountForm.jsx";
import HexDialog from "../../../../shared/presentation/HexDialog.jsx";
import { safeReturnPath } from "../../../../shared/routing/paths.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
export default function CompleteProfilePage() {
  const { profile, accept } = useAccount(), [params] = useSearchParams(), { go } = usePageNavigation();
  const requested = safeReturnPath(params.get("next"), "/student");
  const next = requested.startsWith("/student/profile") ? "/student" : requested;
  const complete = profile.grade && (![11, 12].includes(Number(profile.grade)) || profile.track);
  if (complete) return <Navigate replace to={next} />;
  return <HexDialog wide title="أكمل بياناتك الدراسية" subtitle="احفظ الصف والمسار عند الحاجة لتدخل إلى كتبك الصحيحة مباشرة." onClose={() => go("/")}><AccountForm mode="profile" initialValues={profile} onSubmit={accountRepository.completeProfile} onComplete={identity => { accept(identity); go(next, { replace: true }); }} submitLabel="حفظ الصف والمتابعة" /></HexDialog>;
}
