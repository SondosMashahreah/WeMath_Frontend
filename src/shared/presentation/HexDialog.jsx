import { useEffect, useId, useRef } from "react";
import { FaXmark } from "react-icons/fa6";
export default function HexDialog({ title, subtitle, onClose, wide = false, children }) {
  const dialog = useRef(null), titleId = useId();
  useEffect(() => { const node = dialog.current; node.showModal(); return () => node.close(); }, []);
  return <dialog ref={dialog} className={`student-access-dialog ${wide ? "student-access-register" : ""}`} dir="rtl" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <section className="student-access-shell"><button type="button" className="student-dialog-close student-icon-button" aria-label="إغلاق" onClick={onClose}><FaXmark /></button>
      <div className="student-access-heading"><h2 id={titleId} tabIndex={-1}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}
    </section>
  </dialog>;
}
