import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useFamily } from "../../application/familyContext.js";
import { familyRepository } from "../../infrastructure/familyRepository.js";
import { useAccount } from "../../../account/application/accountContext.js";
import AccountForm from "../../../account/presentation/AccountForm.jsx";
import AccountDialog from "../../../account/presentation/AccountDialog.jsx";
import ProgressDialog from "../ProgressDialog.jsx";
import ResultsDialog from "../ResultsDialog.jsx";
import StudentHive from "../../../../shared/hive/StudentHive.jsx";
import HexDialog from "../../../../shared/presentation/HexDialog.jsx";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
import { childPath } from "../../../../shared/routing/paths.js";
const item = (id, label, lines = [label]) => ({ id, label, lines, kind: "family" });
function ChildPasswordDialog({ child, onClose }) {
  const [saved, setSaved] = useState(false);
  return <HexDialog title={saved ? "تم تغيير كلمة المرور" : "كلمة مرور جديدة"} subtitle={saved ? undefined : "أخبر طفلك بكلمة المرور الجديدة. ستنتهي جلساته السابقة."} onClose={onClose}>
    {saved ? <p role="status">يمكن لطفلك الآن الدخول بكلمة المرور الجديدة.</p> : <AccountForm mode="password" onSubmit={values => familyRepository.resetPassword(child.id, values)} onComplete={() => setSaved(true)} submitLabel="تغيير كلمة المرور" />}
  </HexDialog>;
}
export default function ParentPage({ page = "home" }) {
  const { data, reload } = useFamily(), { profile, clear } = useAccount(), { childId } = useParams(), { go, close } = usePageNavigation();
  const child = data.children.find(entry => String(entry.id) === childId), base = child ? childPath(child.id) : "/parent";
  useEffect(() => {
    const onKey = event => { if (event.key === "Escape" && !document.querySelector("dialog[open]")) { event.preventDefault(); go(childId ? "/parent" : "/"); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [go, childId]);
  const view = useMemo(() => child ? {
    key: `child-${child.id}`, title: child.full_name, centerLines: [child.full_name], hint: "اختر ما تريد متابعته",
    items: [item("@progress", "تقدّمه"), item("@results", "نتائجه"), item("@curriculum", "منهجه"), item("@edit", "بياناته"), item("@password", "كلمة المرور")],
  } : { key: "family", title: "الأهل", centerLines: ["الأهل"], hint: "اختر طفلك أو أضف حسابًا",
    items: [...(data.children).map(entry => item(String(entry.id), entry.full_name, [entry.full_name, entry.grade ? `الصف ${entry.grade}` : "أكمل بياناته"])), ...(data.children.length < 5 ? [item("@add", "إضافة طفل")] : []), item("@account", "حسابي")],
  }, [child, data]);

  function pick(id) {
    if (!id.startsWith("@")) return go(childPath(id));
    const action = id.slice(1);
    if (action === "account") return go("/parent/account");
    if (action === "add") return go("/parent/children/add");
    go(childPath(child.id, action === "curriculum" && !child.grade ? "edit" : action));
  }
  function saved() { reload(); go(base, { replace: true }); }
  if (childId && !child) return <RouteFeedback back="/parent" message="حساب الطفل غير مرتبط بحسابك أو لم يعد متاحًا." />;
  if (["add", "create", "link"].includes(page) && data.children.length >= 5) return <RouteFeedback title="اكتمل عدد الأطفال" message="يمكن ربط خمسة أطفال كحد أقصى بهذا الحساب." back="/parent" />;
  return <main className="student-portal" dir="rtl"><h1 className="sr-only">مساحة الأهل</h1><StudentHive view={view} onSelect={pick} onBack={() => go(child ? "/parent" : "/")} />
    {page === "account" && <AccountDialog profile={profile} onClose={() => close(base)} onLogout={() => { clear(); go("/", { replace: true }); }} />}
    {page === "add" && <HexDialog title="إضافة طفل" subtitle={`${data.children.length} من 5 أطفال`} onClose={() => close(base)}><div className="student-access-choices"><button className="student-primary-button" onClick={() => go("/parent/children/create")}>إنشاء حساب للطفل</button><button className="student-secondary-button" onClick={() => go("/parent/children/link")}>ربط حساب موجود</button></div></HexDialog>}
    {(page === "create" || page === "link") && <HexDialog wide={page === "create"} title={page === "create" ? "حساب طفلك" : "ربط حساب الطالب"} subtitle={page === "create" ? "سيدخل طفلك باسم المستخدم وكلمة المرور اللذين تختارهما له." : "أدخل بيانات حساب الطفل لربطه بحسابك. يمكن ربطه بولي أمر واحد."} onClose={() => close(base)}>
      <AccountForm key={page} mode={page === "create" ? "register" : "link"} onSubmit={familyRepository[page]} onComplete={saved} submitLabel={page === "create" ? "إنشاء حساب الطفل" : "ربط الحساب"} />
    </HexDialog>}
    {child && page === "edit" && <HexDialog wide title={`بيانات ${child.full_name}`} subtitle="تغيير الصف أو إيقاف الدخول ينهي جلسات الطفل الحالية." onClose={() => close(base)}><p className="account-grade">اسم المستخدم: <bdi dir="ltr">{child.username}</bdi></p><AccountForm key={child.id} mode="edit" initialValues={child} onSubmit={values => familyRepository.update(child.id, values)} onComplete={saved} submitLabel="حفظ التعديلات" /></HexDialog>}
    {child && page === "password" && <ChildPasswordDialog key={child.id} child={child} onClose={() => close(base)} />}
    {child && page === "progress" && <ProgressDialog path={`/api/parents/children/${child.id}/progress`} name={child.full_name} onClose={() => close(base)} />}
    {child && page === "results" && <ResultsDialog child={child} onClose={() => close(base)} />}
  </main>;
}
