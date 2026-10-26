import { useCallback, useEffect, useMemo, useState } from "react";
import StudentHive from "../../student/presentation/StudentHive.jsx";
import StudentPortal from "../../student/presentation/StudentPortal.jsx";
import HexDialog from "../../account/presentation/HexDialog.jsx";
import AccountForm from "../../account/presentation/AccountForm.jsx";
import AccountDialog from "../../account/presentation/AccountDialog.jsx";
import ProgressDialog from "./ProgressDialog.jsx";
import { familyRepository } from "../infrastructure/familyRepository.js";
import { useRemote } from "../../../shared/api/useRemote.js";
const item = (id, label, lines = [label]) => ({ id, label, lines, kind: "family" });
export default function ParentPortal({ profile, curriculum, onHome, onLogout }) {
  const { data, error, loading, reload } = useRemote("/api/parents/children");
  const [selectedId, setSelectedId] = useState(null), [modal, setModal] = useState(null), [preview, setPreview] = useState(false);
  const child = data?.children.find(entry => entry.id === selectedId);
  const back = useCallback(() => { if (selectedId) setSelectedId(null); else onHome(); }, [selectedId, onHome]);
  useEffect(() => {
    const onKey = event => { if (event.key === "Escape" && !preview && !document.querySelector("dialog[open]")) { event.preventDefault(); back(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [back, preview]);
  const view = useMemo(() => child ? {
    key: `child-${child.id}`, title: child.full_name, centerLines: [child.full_name], hint: "اختر ما تريد متابعته",
    items: [item("@progress", "تقدّمه"), item("@curriculum", "منهجه"), item("@edit", "بياناته"), item("@password", "كلمة المرور")],
  } : { key: "family", title: "الأهل", centerLines: ["الأهل"], hint: "اختر طفلك أو أضف حسابًا",
    items: [...(data?.children || []).map(entry => item(String(entry.id), entry.full_name, [entry.full_name, entry.grade ? `الصف ${entry.grade}` : "أكمل بياناته"])), ...((data?.children.length || 0) < 5 ? [item("@add", "إضافة طفل")] : []), item("@account", "حسابي")],
  }, [child, data]);
  function pick(id) {
    if (!id.startsWith("@")) { setSelectedId(Number(id)); return; }
    if (id === "@curriculum") { if (child.grade) setPreview(true); else setModal("edit"); return; }
    setModal(id.slice(1));
  }
  function saved() { setModal(null); reload(); }
  if (preview && child) return <StudentPortal key={`preview-${child.id}-${child.grade}`} curriculum={curriculum} profile={child} readOnlyChildId={child.id} onHome={() => setPreview(false)} />;
  return <main className="student-portal" dir="rtl"><h1 className="sr-only">مساحة الأهل</h1><StudentHive view={view} onSelect={pick} onBack={back} />
    {(loading || error) && <HexDialog title="أطفالي" onClose={onHome}>{loading ? <p role="status">جاري تحميل حسابات الأطفال…</p> : <><p role="alert">{error.message}</p><button className="student-primary-button" onClick={reload}>إعادة المحاولة</button></>}</HexDialog>}
    {modal === "account" && <AccountDialog profile={profile} onClose={() => setModal(null)} onLogout={onLogout} />}
    {modal === "add" && <HexDialog title="إضافة طفل" subtitle={`${data.children.length} من 5 أطفال`} onClose={() => setModal(null)}><div className="student-access-choices"><button className="student-primary-button" onClick={() => setModal("create")}>إنشاء حساب للطفل</button><button className="student-secondary-button" onClick={() => setModal("link")}>ربط حساب موجود</button></div></HexDialog>}
    {(modal === "create" || modal === "link") && <HexDialog wide={modal === "create"} title={modal === "create" ? "حساب طفلك" : "ربط حساب الطالب"} subtitle={modal === "create" ? "سيدخل طفلك باسم المستخدم وكلمة المرور اللذين تختارهما له." : "أدخل بيانات حساب الطفل لربطه بحسابك. يمكن ربطه بولي أمر واحد."} onClose={() => setModal(null)}>
      <AccountForm mode={modal === "create" ? "register" : "link"} onSubmit={familyRepository[modal]} onComplete={saved} submitLabel={modal === "create" ? "إنشاء حساب الطفل" : "ربط الحساب"} />
    </HexDialog>}
    {child && modal === "edit" && <HexDialog wide title={`بيانات ${child.full_name}`} subtitle="تغيير الصف أو إيقاف الدخول ينهي جلسات الطفل الحالية." onClose={() => setModal(null)}><p className="account-grade">اسم المستخدم: <bdi dir="ltr">{child.username}</bdi></p><AccountForm mode="edit" initialValues={child} onSubmit={values => familyRepository.update(child.id, values)} onComplete={saved} submitLabel="حفظ التعديلات" /></HexDialog>}
    {child && modal === "password" && <HexDialog title="كلمة مرور جديدة" subtitle="أخبر طفلك بكلمة المرور الجديدة. ستنتهي جلساته السابقة." onClose={() => setModal(null)}><AccountForm mode="password" onSubmit={values => familyRepository.resetPassword(child.id, values)} onComplete={() => setModal("password-saved")} submitLabel="تغيير كلمة المرور" /></HexDialog>}
    {modal === "password-saved" && <HexDialog title="تم تغيير كلمة المرور" onClose={() => setModal(null)}><p role="status">يمكن لطفلك الآن الدخول بكلمة المرور الجديدة.</p></HexDialog>}
    {child && modal === "progress" && <ProgressDialog path={`/api/parents/children/${child.id}/progress`} name={child.full_name} onClose={() => setModal(null)} />}
  </main>;
}
