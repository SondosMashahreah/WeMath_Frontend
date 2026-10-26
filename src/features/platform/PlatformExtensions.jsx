import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { BEE_THEME } from "../../lib/beeConfig.js";
import { EXTENSION_IDS } from "./domain/navigation.js";
import "./platform.css";

const PlatformHub = lazy(() => import("./presentation/PlatformHub.jsx"));

export default function PlatformExtensions({ children }) {
  const [section, setSection] = useState(null);
  const trigger = useRef(null);
  const close = useCallback(() => { setSection(null); requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true })); }, []);
  useEffect(() => {
    if (!section) return;
    const onKey = event => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      if (!document.querySelector(".platform-dialog[open]")) {
        event.preventDefault(); window.dispatchEvent(new Event("wemath:platform-back"));
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [section]);
  function capture(event) {
    if (section) return;
    const button = event.target.closest?.("button[data-cell]");
    if (!button || !EXTENSION_IDS.has(button.dataset.cell)) return;
    event.preventDefault(); event.stopPropagation(); trigger.current = button; setSection(button.dataset.cell);
  }
  return <div className="platform-composition" onClickCapture={capture}>
    <div className="platform-legacy" hidden={Boolean(section)} inert={Boolean(section)}>{children}</div>
    {section && <div className="platform-extension-root student-experience-root" dir="rtl" style={{ "--background": BEE_THEME.background, "--ink": BEE_THEME.ink, "--icon": BEE_THEME.icon, "--student-cream": BEE_THEME.cream }}>
      <Suspense fallback={<div className="bee-error" role="status"><p>جاري التحميل…</p><button onClick={close}>رجوع</button></div>}>
        <PlatformHub section={section} onHome={close} />
      </Suspense>
    </div>}
  </div>;
}
