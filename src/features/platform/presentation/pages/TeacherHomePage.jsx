import { useState } from "react";
import { useTeacher } from "../../application/teacherContext.js";
import { hiveItem } from "../../domain/navigation.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
import HivePage from "../HivePage.jsx";
import PlatformDialog from "../PlatformDialog.jsx";
export default function TeacherHomePage({ account = false }) {
  const { user, logout } = useTeacher(), { go, close } = usePageNavigation(), [busy, setBusy] = useState(false);
  async function signOut() {
    if (busy) return; setBusy(true);
    // Leave the protected route before clearing its session.
    await go("/", { replace: true });
    try { await logout(); } catch { /* Local session is cleared even if the server is unreachable. */ }
  }
  return <HivePage title="المعلّم" hint={`أهلًا ${user.full_name}`} items={[["curriculum", "المنهاج والكتب"], ["plans", "تحضيراتي"], ["resources", "أنشطة وبنك أسئلة"], ["assessments", "اختباراتي"], ["workshops", "ورش المعلّمين"], ["account", "حسابي"]].map(([id, title]) => hiveItem(id, title))} onSelect={id => {
    if (["plans", "resources", "assessments"].includes(id)) {
      return;
    }

    go(`/teachers/${id}`);
  }} onBack={() => go("/")}>
    {account && <PlatformDialog title="حساب المعلّم" subtitle={user.full_name} onClose={() => close("/teachers")}><p>اسم المستخدم: <bdi>{user.username}</bdi></p>{user.school && <p>{user.school}</p>}<button className="student-secondary-button" disabled={busy} onClick={signOut}>{busy ? "جاري الخروج…" : "تسجيل خروج المعلّم"}</button></PlatformDialog>}
  </HivePage>;
}
