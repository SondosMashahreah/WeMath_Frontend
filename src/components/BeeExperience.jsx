import { useEffect, useRef, useState } from "react";
import { BEE_THEME, HIVE_ITEMS } from "../lib/beeConfig.js";
import HiveIcon from "./HiveIcon.jsx";

export default function BeeExperience({ active = true, modalOpen = false, skipIntro = false, onStudentRequest, onParentRequest, onSectionRequest }) {
  const host = useRef(null), canvas = useRef(null), engine = useRef(null);
  const hitTargets = useRef({}), centerButton = useRef(null);
  const [rendererState, setRendererState] = useState("loading");
  const [stage, setStage] = useState("wordmark");
  const [finished, setFinished] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const skipOnMount = useRef(skipIntro);

  useEffect(() => {
    let cancelled = false;
    import("../scene/beeScene.js").then(({ createBeeScene }) => {
      if (cancelled) return;
      try {
        engine.current = createBeeScene({
          canvas: canvas.current, host: host.current, hitTargets,
          reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          onStage: setStage, onFinish: () => setFinished(true), onMenu: setMenuOpen,
        });
        if (skipOnMount.current) engine.current.skip();
        setRendererState("ready");
      } catch (error) {
        console.error("WE MATH could not start:", error);
        setRendererState("error");
      }
    }).catch(error => {
      if (!cancelled) { console.error(error); setRendererState("error"); }
    });
    return () => { cancelled = true; engine.current?.dispose(); engine.current = null; };
  }, []);

  useEffect(() => {
    if (rendererState !== "ready") return;
    engine.current?.setActive(active);
    if (active && finished) host.current?.querySelector('[data-cell="students"]')?.focus({ preventScroll: true });
  }, [active, rendererState, finished]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => engine.current?.setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    const onKey = event => {
      if (!active || modalOpen) return;
      if (event.key !== "Escape") return;
      if (!finished) engine.current?.skip();
      else if (menuOpen) { engine.current?.toggleMenu(); centerButton.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, menuOpen, active, modalOpen]);

  const hover = event => engine.current?.hover(event.currentTarget.dataset.hoverId);
  const clearHover = () => engine.current?.hover(null);

  return (
    <main ref={host} className="bee-experience" hidden={!active} data-stage={stage} data-renderer={rendererState}
      data-menu={menuOpen ? "open" : "closed"} aria-label="WE MATH"
      style={{ "--background": BEE_THEME.background, "--ink": BEE_THEME.ink, "--icon": BEE_THEME.icon }}>
      <canvas ref={canvas} className="bee-canvas" aria-hidden="true" />
      <h1 className="sr-only">WE MATH</h1>
      <p className="sr-only" role="status" aria-live="polite" dir="rtl">
        {finished ? "اضغطي على السداسي الكبير لإظهار الأقسام العشرة." : "تعمل الافتتاحية الآن. يمكن تجاوزها بمفتاح Escape."}
      </p>

      {rendererState === "ready" && <>
        <button type="button"
          ref={node => { centerButton.current = node; hitTargets.current.center = node; }}
          className="bee-hit bee-center-hit" hidden={!finished}
          onClick={() => engine.current?.toggleMenu()}
          aria-label={menuOpen ? "WE MATH — إغلاق الأقسام" : "WE MATH — إظهار الأقسام"}
          aria-expanded={menuOpen} aria-controls="honeycomb-buttons" data-hover-id="center"
          onPointerEnter={hover} onPointerLeave={clearHover} onFocus={hover} onBlur={clearHover}
        ><span className="sr-only">WE MATH</span></button>

        <div id="honeycomb-buttons" className="bee-buttons" role="group" aria-label="الأقسام" hidden={!menuOpen}>
          {HIVE_ITEMS.map(item => <button type="button"
            key={item.id} ref={node => { hitTargets.current[item.id] = node; }}
            className={`bee-hit bee-cell${item.lines.length > 1 ? " bee-cell-multiline" : ""}`}
            data-cell={item.id} data-hover-id={item.id} aria-label={item.label}
            onPointerEnter={hover} onPointerLeave={clearHover} onFocus={hover} onBlur={clearHover}
            onClick={item.id === "students" ? onStudentRequest : item.id === "parents" ? onParentRequest : item.id === "steam" ? () => window.open("https://steam.ps/", "_blank", "noopener,noreferrer") : () => onSectionRequest?.(item.id)}
          >
            <span className="bee-cell-content bee-mobile-content" dir={item.id === "steam" ? "ltr" : "rtl"} aria-hidden="true">
              <HiveIcon name={item.id} />
              <span className="bee-cell-label">{item.lines.map((line, i) => <span key={i}>{line}</span>)}</span>
            </span>
            <span className="bee-cell-face bee-cell-front" aria-hidden="true">
              <HiveIcon name={item.id} />
            </span>
            <span className="bee-cell-face bee-cell-back" dir={item.id === "steam" ? "ltr" : "rtl"} aria-hidden="true">
              <span className="bee-cell-label">{item.lines.map((line, i) => <span key={i}>{line}</span>)}</span>
            </span>
          </button>)}
        </div>
      </>}

      {rendererState === "error" && <div className="bee-error" role="alert" dir="rtl">
        <p>تعذّر تشغيل المشهد ثلاثي الأبعاد. جرّبي متصفحًا يدعم WebGL 2 مع تفعيل تسريع الرسومات.</p>
        <button type="button" onClick={() => window.location.reload()}>إعادة المحاولة</button>
      </div>}
    </main>
  );
}
