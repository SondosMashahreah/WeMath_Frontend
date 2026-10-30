import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStudentJourney } from "../application/useStudentJourney.js";
import StudentHive from "../../../shared/hive/StudentHive.jsx";
import LessonResourceDialog from "./LessonResourceDialog.jsx";
import HexDialog from "../../account/presentation/HexDialog.jsx";
import AccountDialog from "../../account/presentation/AccountDialog.jsx";
import { useStudentProgress } from "../application/useStudentProgress.js";
import { usePageNavigation } from "../../../shared/routing/usePageNavigation.js";
import { studentPath } from "../../../shared/routing/paths.js";
import RouteFeedback from "../../../shared/presentation/RouteFeedback.jsx";
export default function StudentPortal({ curriculum, profile, onHome, onLogout, readOnlyChildId, basePath = "/student", accountOpen = false }) {
  const { state, view, select, activity, valid } = useStudentJourney(curriculum, profile.grade, profile.track, basePath);
  const { go, close, location } = usePageNavigation();
  const { notice, save: saveActivity, dismiss } = useStudentProgress(valid ? state.lesson : null, activity, Boolean(readOnlyChildId));
  const heading = useRef(null), scroll = useRef(null);
  const back = useCallback(() => {
    const pathname = location.pathname.replace(/\/+$/, "");

    // activity -> lesson
    if (/\/activities\/[^/]+$/.test(pathname)) {
      go(pathname.replace(/\/activities\/[^/]+$/, ""), { replace: true });
      return;
    }

    // lesson -> unit
    if (/\/lessons\/[^/]+$/.test(pathname)) {
      go(pathname.replace(/\/lessons\/[^/]+$/, ""), { replace: true });
      return;
    }

    // unit -> book
    if (/\/units\/[^/]+$/.test(pathname)) {
      go(pathname.replace(/\/units\/[^/]+$/, ""), { replace: true });
      return;
    }

    // A sole book auto-opens at the root, so exit the curriculum directly.
    if (/\/books\/[^/]+$/.test(pathname)) {
      if (curriculum.listBooks(profile.grade, profile.track).length === 1) {
        onHome();
        return;
      }
      go(basePath, { replace: true });
      return;
    }

    // account -> student root
    if (pathname === `${basePath}/account`) {
      go(basePath, { replace: true });
      return;
    }

    // student root -> main platform
    if (pathname === basePath) {
      onHome();
      return;
    }

    // safety fallback
    go(basePath, { replace: true });
  }, [location.pathname, go, basePath, onHome, curriculum, profile.grade, profile.track]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); scroll.current?.scrollTo({ top: 0, behavior: "instant" }); }, [view.key]);
  useEffect(() => {
    const onKey = event => { if (event.key === "Escape" && !document.querySelector("dialog[open]")) { event.preventDefault(); back(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [back]);
  const displayView = useMemo(() => ({ ...view, items: [ ...view.items.filter(item => !readOnlyChildId || item.id !== "@completed"),
    ...(!readOnlyChildId && !state.lesson ? [{ id: "@account", label: "حسابي", lines: ["حسابي"], kind: "account" }] : []),
  ] }), [view, state.semester, readOnlyChildId, state.lesson]);
function pick(id) {
  if (!id.startsWith("@")) return select(id);

  if (id === "@account") {
    return go(`${basePath}/account`);
  }

  // Lesson activity hexagons stay clickable visually,
  // but intentionally do nothing for now.
  return;
}
  if (!valid) return <RouteFeedback back={basePath} message="هذا الدرس أو النشاط لا يتبع المنهاج المتاح لهذا الحساب." />;
  return <main className="student-portal" dir="rtl" ref={scroll}>
    <h1 className="sr-only" ref={heading} tabIndex={-1}>{view.title} — {view.hint}</h1>
    <StudentHive view={displayView} selectedLesson={state.lesson} onSelect={id => {
      if (id === "@account") {
        go(`${basePath}/account`);
        return;
      }

      pick(id);
    }} onBack={back} />
    {readOnlyChildId && <span className="parent-preview-label">معاينة منهج {profile.full_name} · لا تُسجَّل كإنجاز للطفل</span>}
    {activity && <LessonResourceDialog key={`${state.lesson}-${activity}`} lessonId={state.lesson} activity={activity} title={view.title} readOnlyChildId={readOnlyChildId} onVideoPlay={() => saveActivity(activity)} onClose={() => close(studentPath(state, basePath))} />}
    {accountOpen && <AccountDialog profile={profile} onClose={() => close(basePath)} onLogout={onLogout} />}
    {notice && <HexDialog title={notice.title} onClose={dismiss}><p role="status">{notice.text}</p><button className="student-primary-button" onClick={dismiss}>متابعة</button></HexDialog>}
  </main>;
}
