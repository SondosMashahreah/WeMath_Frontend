import { useEffect, useState } from "react";
import { usePlatformData } from "../application/usePlatformData.js";
import { hiveItem } from "../domain/navigation.js";
import { teacherLogout, teacherToken } from "../infrastructure/client.js";
import ContentPortal from "./ContentPortal.jsx";
import DocumentEditor from "./DocumentEditor.jsx";
import HivePage from "./HivePage.jsx";
import LoadDialog from "./LoadDialog.jsx";
import PlatformDialog from "./PlatformDialog.jsx";
import TeacherAuth from "./TeacherAuth.jsx";
import TeacherCurriculum from "./TeacherCurriculum.jsx";
import TeacherDocuments from "./TeacherDocuments.jsx";

export default function TeacherPortal({ onBack }) {
  const [hasSession, setHasSession] = useState(() => Boolean(teacherToken())), [identity, setIdentity] = useState(null);
  const [view, setView] = useState("home"), [editor, setEditor] = useState(null), [saved, setSaved] = useState(null), [busy, setBusy] = useState(false);
  const restore = usePlatformData(hasSession && !identity ? "/api/platform/teachers/me" : null, true);
  const user = identity || restore.data;
  useEffect(() => {
    const expired = () => { setHasSession(false); setIdentity(null); setView("home"); setEditor(null); setSaved(null); };
    window.addEventListener("wemath:teacher-expired", expired);
    return () => window.removeEventListener("wemath:teacher-expired", expired);
  }, []);
  async function logout() {
    if (busy) return;
    setBusy(true);
    try { await teacherLogout(); } catch { /* Clear this teacher's local session even when the network is unavailable. */ }
    setIdentity(null); setHasSession(false); setView("home"); setBusy(false);
  }
  if (!hasSession) return <TeacherAuth onClose={onBack} onComplete={account => { setIdentity(account); setHasSession(true); }} />;
  if (!user) return <LoadDialog state={restore} onClose={onBack} />;
  const home = () => setView("home");
  const edit = (kind, initial = {}) => setEditor({ kind, initial });
  let page;
  if (view === "curriculum") page = <TeacherCurriculum onBack={home} onPrepare={initial => edit("plan", initial)} onAssessment={initial => edit("assessment", initial)} onResources={() => setView("resources")} />;
  else if (view === "plans" || view === "assessments") page = <TeacherDocuments key={`${view}-${saved?.id || ""}-${saved?.version || ""}`} kind={view === "plans" ? "plan" : "assessment"} onBack={home} onEdit={initial => edit(view === "plans" ? "plan" : "assessment", initial)} />;
  else if (view === "resources" || view === "workshops") page = <ContentPortal section={view === "resources" ? "teacher_resources" : "workshops"} onBack={home} />;
  else page = <HivePage title="المعلّم" hint={`أهلًا ${user.full_name}`} items={[["curriculum", "المنهاج والكتب"], ["plans", "تحضيراتي"], ["resources", "أنشطة وبنك أسئلة"], ["assessments", "اختباراتي"], ["workshops", "ورش المعلّمين"], ["account", "حسابي"]].map(([id, title]) => hiveItem(id, title))} onSelect={setView} onBack={onBack} />;
  return <>{page}
    {view === "account" && <PlatformDialog title="حساب المعلّم" subtitle={user.full_name} onClose={home}><p>اسم المستخدم: <bdi>{user.username}</bdi></p>{user.school && <p>{user.school}</p>}<button className="student-secondary-button" disabled={busy} onClick={logout}>{busy ? "جاري الخروج…" : "تسجيل خروج المعلّم"}</button></PlatformDialog>}
    {editor && <DocumentEditor {...editor} onClose={() => setEditor(null)} onSaved={document => { setSaved(document); setEditor(null); setView(document.kind === "plan" ? "plans" : "assessments"); }} />}
  </>;
}
