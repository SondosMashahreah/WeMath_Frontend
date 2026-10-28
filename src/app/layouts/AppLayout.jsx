import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BeeExperience from "../../components/BeeExperience.jsx";
import { BEE_THEME } from "../../lib/beeConfig.js";
import { HOME_PATHS } from "../../shared/routing/paths.js";
import "../../features/student/presentation/student.css";
import "../../features/platform/platform.css";
export default function AppLayout() {
  const { pathname } = useLocation(), navigate = useNavigate();
  const [skipIntro] = useState(() => pathname !== "/");
  const access = /^\/(student|parent|teachers)\/(login|register|access)$/.test(pathname), atHome = pathname === "/";
  useEffect(() => { document.title = `WE MATH${atHome ? "" : " · " + ({ student: "الطالب", parent: "الأهل", teachers: "المعلّم", guest: "الزائر", workshops: "الورشات", competitions: "المسابقات", initiatives: "المبادرات", research: "الأبحاث", assistant: "Algo" }[pathname.split("/")[1]] || "المنصة")}`; }, [pathname, atHome]);
  return <div className="student-experience-root" style={{ "--background": BEE_THEME.background, "--ink": BEE_THEME.ink, "--icon": BEE_THEME.icon, "--student-cream": BEE_THEME.cream }}>
    <BeeExperience active={atHome || access} modalOpen={access} skipIntro={skipIntro} onStudentRequest={() => navigate("/student")} onParentRequest={() => navigate("/parent")} onSectionRequest={id => { if (HOME_PATHS[id]) navigate(HOME_PATHS[id]); }} />
    <Outlet />
  </div>;
}
