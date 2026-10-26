import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudentJourney } from "../application/useStudentJourney.js";
import StudentHive from "./StudentHive.jsx";
import LessonResourceDialog from "./LessonResourceDialog.jsx";
import HexDialog from "../../account/presentation/HexDialog.jsx";
import AccountDialog from "../../account/presentation/AccountDialog.jsx";
import { apiRequest } from "../../../shared/api/client.js";
export default function StudentPortal({ curriculum, profile, onHome, onLogout, readOnlyChildId }) {
  const { state, view, select, navigate } = useStudentJourney(curriculum, profile.grade);
  const [activity, setActivity] = useState(null), [accountOpen, setAccountOpen] = useState(false), [notice, setNotice] = useState(null), [saving, setSaving] = useState(false);
  const heading = useRef(null), scroll = useRef(null);
  const back = useCallback(() => { if (state.semester) navigate({ type: "back" }); else onHome(); }, [state.semester, navigate, onHome]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); scroll.current?.scrollTo({ top: 0, behavior: "instant" }); }, [view.key]);
  useEffect(() => {
    const onKey = event => { if (event.key === "Escape" && !document.querySelector("dialog[open]")) { event.preventDefault(); back(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [back]);
  useEffect(() => {
    if (!state.lesson || readOnlyChildId) return;
    const controller = new AbortController();
    apiRequest(`/api/learning/lessons/${state.lesson}/progress`, { method: "PUT", body: { activity: "opened" }, signal: controller.signal })
      .catch(error => { if (error.name !== "AbortError") setNotice({ title: "لم يُحفظ التقدّم", text: error.message }); });
    return () => controller.abort();
  }, [state.lesson, readOnlyChildId]);
  const displayView = useMemo(() => ({ ...view, items: [ ...view.items.filter(item => !readOnlyChildId || item.id !== "@completed"),
    ...(!state.semester && !readOnlyChildId ? [{ id: "@account", label: "حسابي", lines: ["حسابي"], kind: "account" }] : []),
  ] }), [view, state.semester, readOnlyChildId]);
  async function saveActivity(kind) {
    if (!state.lesson || readOnlyChildId || saving) return;
    setSaving(true);
    try {
      await apiRequest(`/api/learning/lessons/${state.lesson}/progress`, { method: "PUT", body: { activity: kind } });
      if (kind === "completed") setNotice({ title: "أحسنت!", text: "حُفظ إنجازك لهذا الدرس. يمكنك الرجوع إليه في أي وقت." });
    } catch (error) { setActivity(null); setNotice({ title: "لم يُحفظ التقدّم", text: error.message }); }
    finally { setSaving(false); }
  }
  async function pick(id) {
    if (!id.startsWith("@")) { select(id); return; }
    if (id === "@account") { setAccountOpen(true); return; }
    const kind = id.slice(1);
    if (!["book", "completed"].includes(kind)) setActivity(kind);
    // Placeholder video is not counted as watched. Attached video records on play.
    if (kind !== "video") await saveActivity(kind);
  }
  return <main className="student-portal" dir="rtl" ref={scroll}>
    <h1 className="sr-only" ref={heading} tabIndex={-1}>{view.title} — {view.hint}</h1>
    <StudentHive view={displayView} selectedLesson={state.lesson} onSelect={pick} onBack={back} />
    {readOnlyChildId && <span className="parent-preview-label">معاينة منهج {profile.full_name} · لا تُسجَّل كإنجاز للطفل</span>}
    {activity && <LessonResourceDialog key={`${state.lesson}-${activity}`} lessonId={state.lesson} activity={activity} title={view.title} readOnlyChildId={readOnlyChildId} onVideoPlay={() => saveActivity("video")} onClose={() => setActivity(null)} />}
    {accountOpen && <AccountDialog profile={profile} onClose={() => setAccountOpen(false)} onLogout={onLogout} />}
    {notice && <HexDialog title={notice.title} onClose={() => setNotice(null)}><p role="status">{notice.text}</p><button className="student-primary-button" onClick={() => setNotice(null)}>متابعة</button></HexDialog>}
  </main>;
}
