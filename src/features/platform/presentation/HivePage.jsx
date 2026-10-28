import { useEffect, useMemo } from "react";
import StudentHive from "../../../shared/hive/StudentHive.jsx";

export default function HivePage({ title, hint = "اختر خلية للمتابعة؛ الوسط للرجوع", items, onSelect, onBack, children }) {
  const view = useMemo(() => ({ key: title, title, centerLines: [title.length > 40 ? title.slice(0, 38) + "…" : title], hint, items }), [title, hint, items]);
  useEffect(() => {
    const back = event => { if (event.key === "Escape" && !document.querySelector("dialog[open]")) { event.preventDefault(); onBack(); } };
    window.addEventListener("keydown", back); return () => window.removeEventListener("keydown", back);
  }, [onBack]);
  return <section className="student-portal platform-portal" aria-label={title}>
    <h1 className="sr-only">{title}</h1>
    <StudentHive view={view} onSelect={onSelect} onBack={onBack} />
    {children}
  </section>;
}
