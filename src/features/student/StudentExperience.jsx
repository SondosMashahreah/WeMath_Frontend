import { useCallback, useEffect, useRef, useState } from "react";
import BeeExperience from "../../components/BeeExperience.jsx";
import { BEE_THEME } from "../../lib/beeConfig.js";
import { loadCurriculumRepository } from "./infrastructure/apiCurriculumRepository.js";
import StudentAccessDialog from "./presentation/StudentAccessDialog.jsx";
import StudentPortal from "./presentation/StudentPortal.jsx";
import ParentPortal from "../parent/presentation/ParentPortal.jsx";
import HexDialog from "../account/presentation/HexDialog.jsx";
import AccountForm from "../account/presentation/AccountForm.jsx";
import { accountRepository } from "../account/infrastructure/accountRepository.js";
import { canEnterPortal, restoredPortalRole } from "../account/domain/portalAccess.js";
import "./presentation/student.css";
// Composition root: account, curriculum, family and scene adapters meet here.
export default function StudentExperience() {
  const [profile, setProfile] = useState(null), [curriculum, setCurriculum] = useState(null);
  const [curriculumError, setCurriculumError] = useState(null), [retry, setRetry] = useState(0);
  const [accessRole, setAccessRole] = useState(null), [portalRole, setPortalRole] = useState(null), [sessionMessage, setSessionMessage] = useState("");
  const restoreRequest = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    loadCurriculumRepository({ signal: controller.signal }).then(data => { setCurriculum(data); setCurriculumError(null); }).catch(error => { if (error.name !== "AbortError") setCurriculumError(error); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    restoreRequest.current = controller;
    accountRepository.restore(controller.signal).then(identity => {
      if (identity && !controller.signal.aborted) {
        setProfile(identity);
        setPortalRole(restoredPortalRole(identity));
      }
    }).catch(error => { if (!controller.signal.aborted && error.name !== "AbortError" && error.status !== 401) setSessionMessage(error.message); });
    return () => controller.abort();
  }, []);
  const logout = useCallback(() => {
    restoreRequest.current?.abort();
    accountRepository.clearSession();
    setProfile(null); setPortalRole(null); setAccessRole(null);
  }, []);
  useEffect(() => {
    const expired = () => { logout(); setSessionMessage("انتهت الجلسة أو تغيرت بيانات الحساب. سجّل الدخول مجددًا."); };
    window.addEventListener("wemath:session-expired", expired); return () => window.removeEventListener("wemath:session-expired", expired);
  }, [logout]);
  const goHome = useCallback(() => setPortalRole(null), []);
  function requestAccess(role) {
    // The clicked entry owns navigation, even if session restoration is still pending.
    restoreRequest.current?.abort();
    setSessionMessage("");
    if (canEnterPortal(profile, role)) {
      setAccessRole(null); setPortalRole(role);
    } else {
      // Only one account is active in this tab. Switching roles requires its credentials.
      accountRepository.clearSession();
      setProfile(null); setPortalRole(null); setAccessRole(role);
    }
  }
  function enter(identity, role) { setProfile(identity); setAccessRole(null); setPortalRole(role); }
  const portalOpen = canEnterPortal(profile, portalRole);
  const needsGrade = portalOpen && portalRole === "student" && !profile.grade;
  return <div className="student-experience-root" style={{ "--background": BEE_THEME.background, "--ink": BEE_THEME.ink, "--icon": BEE_THEME.icon, "--student-cream": BEE_THEME.cream }}>
    <BeeExperience active={!portalOpen} modalOpen={Boolean(accessRole || sessionMessage)} onStudentRequest={() => requestAccess("student")} onParentRequest={() => requestAccess("parent")} />
    {accessRole && <StudentAccessDialog key={accessRole} role={accessRole} onClose={() => setAccessRole(null)} onComplete={identity => enter(identity, accessRole)} />}
    {portalOpen && profile && curriculum && !needsGrade && (portalRole === "parent" ? <ParentPortal profile={profile} curriculum={curriculum} onHome={goHome} onLogout={logout} /> : <StudentPortal key={`${profile.id}-${profile.grade}`} profile={profile} curriculum={curriculum} onHome={goHome} onLogout={logout} />)}
    {portalOpen && profile && needsGrade && <HexDialog wide title="أكمل صفك الدراسي" subtitle="حسابك موجود مسبقًا؛ احفظ صفك مرة واحدة لتدخل إليه مباشرة." onClose={goHome}><AccountForm mode="profile" initialValues={profile} onSubmit={accountRepository.completeProfile} onComplete={setProfile} submitLabel="حفظ الصف والمتابعة" /></HexDialog>}
    {portalOpen && !curriculum && !needsGrade && <HexDialog title="المنهاج" onClose={goHome}><p role={curriculumError ? "alert" : "status"}>{curriculumError?.message || "جاري تحميل المنهاج…"}</p>{curriculumError && <button className="student-primary-button" onClick={() => { setCurriculumError(null); setRetry(value => value + 1); }}>إعادة المحاولة</button>}</HexDialog>}
    {sessionMessage && <HexDialog title="حسابك" onClose={() => setSessionMessage("")}><p role="alert">{sessionMessage}</p></HexDialog>}
  </div>;
}
