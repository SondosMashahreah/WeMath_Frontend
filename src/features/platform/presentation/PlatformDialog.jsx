import { useEffect, useId, useRef } from "react";
import HexScrollIndicator from "../../../shared/presentation/HexScrollIndicator.jsx";

export default function PlatformDialog({ title, subtitle, onClose, wide = false, children }) {
  const ref = useRef(null), titleId = useId();
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={`student-access-dialog platform-dialog${wide ? " student-access-register" : ""}`} dir="rtl" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) onClose(); }}>
    <section className="student-access-shell">
      <button className="student-dialog-close student-icon-button platform-no-print" type="button" aria-label="إغلاق" onClick={onClose}>×</button>
      <div className="hex-dialog-scroll">
        <div className="student-access-heading platform-no-print"><span className="student-eyebrow">WE MATH</span><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {children}
      </div>
      <HexScrollIndicator />
    </section>
  </dialog>;
}
