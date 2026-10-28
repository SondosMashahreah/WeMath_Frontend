import { useEffect, useRef, useState } from "react";

function fitTextClass(value = "") {
  const length = String(value).trim().length;
  if (length >= 34) return "student-text-xxl";
  if (length >= 25) return "student-text-xl";
  if (length >= 17) return "student-text-lg";
  if (length >= 11) return "student-text-md";
  return "student-text-sm";
}

function CellContent({ item, back = false }) {
  const labelText = item.lines?.join(" ") || item.label || "";
  return <span className={`student-cell-content student-cell-${item.kind}`}>
    {item.kind === "grade" ? <>
      {back && <span className="student-cell-caption">الصف</span>}
      <span className="student-cell-number" dir="ltr">{item.number}</span>
    </> : item.lines.map((line, i) => <span
      key={i}
      className={/^\d+$/.test(line)
        ? "student-cell-number"
        : `student-cell-caption ${fitTextClass(labelText)}`}
    >{line}</span>)}
  </span>;
}

export default function StudentHive({ view, selectedLesson, onSelect, onBack }) {
  const host = useRef(null), canvas = useRef(null), engine = useRef(null), hitTargets = useRef({});
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let cancelled = false;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => engine.current?.setReduced(media.matches);
    media.addEventListener("change", onChange);
    import("./createStudentScene.js").then(({ createStudentScene }) => {
      if (cancelled) return;
      try {
        engine.current = createStudentScene({ canvas: canvas.current, host: host.current, hitTargets, reduced: media.matches });
        setStatus("ready");
      } catch (error) { console.error("Student hive could not start:", error); setStatus("error"); }
    }).catch(error => { if (!cancelled) { console.error(error); setStatus("error"); } });
    return () => { cancelled = true; media.removeEventListener("change", onChange); engine.current?.dispose(); engine.current = null; };
  }, []);
  useEffect(() => { if (status === "ready") engine.current.setItems(view.items); }, [status, view.items]);
  const hover = event => engine.current?.hover(event.currentTarget.dataset.hoverId);
  const leave = () => engine.current?.hover(null);
  return <div className="student-hive-stage bee-experience" ref={host} data-view={view.key} aria-busy={status === "loading"}>
    <canvas className="bee-canvas" ref={canvas} aria-hidden="true" />
    {status === "ready" && <>
      <button type="button" className="bee-hit student-center" ref={node => { hitTargets.current.center = node; }}
        data-hover-id="center" aria-label={`${view.title} — رجوع`} onClick={onBack}
        onPointerEnter={hover} onPointerLeave={leave} onFocus={hover} onBlur={leave}>
        <span
          key={view.key}
          className={`student-center-content ${fitTextClass(view.centerLines.join(" "))}`}
          aria-hidden="true"
        >
          {view.centerLines.map((line, i) => <span key={i} dir={/^\d+$/.test(line) ? "ltr" : "rtl"}>{line}</span>)}
        </span>
      </button>
      <div className="bee-buttons" role="group" aria-label={view.hint}>
        {view.items.map(item => { const Cell = item.href ? "a" : "button"; return <Cell key={item.id} type={item.href ? undefined : "button"}
          href={item.href} target={item.href ? "_blank" : undefined} rel={item.href ? "noopener noreferrer" : undefined}
          ref={node => { if (node) hitTargets.current[item.id] = node; else delete hitTargets.current[item.id]; }}
          className={`bee-hit bee-cell student-cell${selectedLesson === item.id ? " is-selected" : ""}`} data-hover-id={item.id}
          aria-label={item.label} aria-pressed={item.kind === "lesson" ? selectedLesson === item.id : undefined}
          onClick={() => onSelect(item.id)} onPointerEnter={hover} onPointerLeave={leave} onFocus={hover} onBlur={leave}>
          <span className="bee-cell-face bee-cell-front" dir="rtl" aria-hidden="true"><CellContent item={item} /></span>
          <span className="bee-cell-face bee-cell-back" dir="rtl" aria-hidden="true"><CellContent item={item} back /></span>
        </Cell>; })}
      </div>
    </>}
    {status === "error" && <div className="bee-error" role="alert"><p>تعذّر عرض الخلايا. جرّب متصفحًا يدعم WebGL 2.</p><button onClick={onBack}>رجوع</button></div>}
  </div>;
}
