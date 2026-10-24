import { useCallback, useState } from "react";
import BeeExperience from "../../components/BeeExperience.jsx";
import { BEE_THEME } from "../../lib/beeConfig.js";
import { previewCurriculumRepository } from "./infrastructure/previewCurriculumRepository.js";
import StudentAccessDialog from "./presentation/StudentAccessDialog.jsx";
import StudentPortal from "./presentation/StudentPortal.jsx";
import "./presentation/student.css";

// Composition root. Demo identity stays in memory; no auth adapter is implied.
export default function StudentExperience() {
  const [profile, setProfile] = useState(null);
  const [accessOpen, setAccessOpen] = useState(false), [portalOpen, setPortalOpen] = useState(false);
  const goHome = useCallback(() => setPortalOpen(false), []);
  const requestStudent = () => { if (profile) setPortalOpen(true); else setAccessOpen(true); };
  const enter = identity => { setProfile(identity); setAccessOpen(false); setPortalOpen(true); };
  return <div className="student-experience-root" style={{ "--background": BEE_THEME.background, "--ink": BEE_THEME.ink, "--icon": BEE_THEME.icon, "--student-cream": BEE_THEME.cream }}>
    <BeeExperience active={!portalOpen} modalOpen={accessOpen} onStudentRequest={requestStudent} />
    {accessOpen && <StudentAccessDialog onClose={() => setAccessOpen(false)} onComplete={enter} />}
    {portalOpen && <StudentPortal curriculum={previewCurriculumRepository} onHome={goHome} />}
  </div>;
}
