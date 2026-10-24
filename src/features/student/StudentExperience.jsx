import { useCallback, useEffect, useState } from "react";
import BeeExperience from "../../components/BeeExperience.jsx";
import { BEE_THEME } from "../../lib/beeConfig.js";
import { loadCurriculumRepository } from "./infrastructure/apiCurriculumRepository.js";
import StudentAccessDialog from "./presentation/StudentAccessDialog.jsx";
import StudentPortal from "./presentation/StudentPortal.jsx";
import "./presentation/student.css";

// Composition root. Curriculum is loaded once from the FastAPI backend and
// exposed to the existing journey as an in-memory repository.
export default function StudentExperience() {
  const [profile, setProfile] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [curriculumError, setCurriculumError] = useState(null);
  const [accessOpen, setAccessOpen] = useState(false), [portalOpen, setPortalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadCurriculumRepository({ signal: controller.signal })
      .then(setCurriculum)
      .catch(error => { if (error.name !== "AbortError") setCurriculumError(error); });
    return () => controller.abort();
  }, []);

  const goHome = useCallback(() => setPortalOpen(false), []);
  const requestStudent = () => { if (profile) setPortalOpen(true); else setAccessOpen(true); };
  const enter = identity => { setProfile(identity); setAccessOpen(false); setPortalOpen(true); };

  return <div className="student-experience-root" style={{ "--background": BEE_THEME.background, "--ink": BEE_THEME.ink, "--icon": BEE_THEME.icon, "--student-cream": BEE_THEME.cream }}>
    <BeeExperience active={!portalOpen} modalOpen={accessOpen} onStudentRequest={requestStudent} />
    {accessOpen && <StudentAccessDialog onClose={() => setAccessOpen(false)} onComplete={enter} />}
    {portalOpen && curriculum && <StudentPortal curriculum={curriculum} onHome={goHome} />}
    {portalOpen && !curriculum && <div className="bee-error" role="status">
      <p>{curriculumError ? "تعذّر تحميل المنهاج من الخادم." : "جاري تحميل المنهاج..."}</p>
      {curriculumError && <button type="button" onClick={goHome}>رجوع</button>}
    </div>}
  </div>;
}
