import { useEffect, useRef, useState } from "react";

const PATH_D = "M 75.3 2.4 L 97.8 43.3 L 75.3 84.2";

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

export default function HexScrollIndicator() {
  const hostRef = useRef(null);
  const pathRef = useRef(null);
  const areaRef = useRef(null);

  const [scroll, setScroll] = useState({
    ratio: 0,
    thumbRatio: 0.72,
    canScroll: false,
  });

  useEffect(() => {
    const host = hostRef.current;
    const shell = host?.closest(".student-access-shell");
    const area = shell?.querySelector(".hex-dialog-scroll");

    if (!area) return;

    areaRef.current = area;

    const update = () => {
      const max = Math.max(
        0,
        area.scrollHeight - area.clientHeight
      );

      const contentHeight =
        Math.max(area.scrollHeight, 1);

      const visibleRatio =
        area.clientHeight / contentHeight;

      const thumbRatio =
        max > 0
          ? clamp(visibleRatio, 0.18, 0.72)
          : 0.72;

      setScroll({
        ratio:
          max > 0
            ? area.scrollTop / max
            : 0,
        thumbRatio,
        canScroll: max > 2,
      });
    };

    update();

    area.addEventListener("scroll", update, {
      passive: true,
    });

    const observer = new ResizeObserver(update);
    observer.observe(area);

    if (area.firstElementChild) {
      observer.observe(area.firstElementChild);
    }

    return () => {
      area.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function step(direction) {
    const area = areaRef.current;

    if (!area || !scroll.canScroll) return;

    area.scrollBy({
      top:
        direction *
        Math.max(80, area.clientHeight * 0.18),
      behavior: "smooth",
    });
  }

  const thumbLength =
    scroll.thumbRatio * 100;

  const thumbStart =
    scroll.ratio *
    (100 - thumbLength);

  if (!scroll.canScroll) return null;

  return (
    <svg
      ref={hostRef}
      className={`hex-edge-scroll ${
        scroll.canScroll ? "is-scrollable" : "is-static"
      }`}
      viewBox="0 0 100 86.6"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        className="hex-edge-scroll-track"
        d={PATH_D}
        pathLength="100"
      />

      <path
        className="hex-edge-scroll-thumb"
        d={PATH_D}
        pathLength="100"
        strokeDasharray={`${thumbLength} ${100 - thumbLength}`}
        strokeDashoffset={-thumbStart}
      />

      <path
        className="hex-scroll-arrow"
        d="M 75.3 0.55 L 73.7 3.15 L 76.9 3.15 Z"
        onClick={() => step(-1)}
      />

      <path
        className="hex-scroll-arrow"
        d="M 75.3 86.05 L 73.7 83.45 L 76.9 83.45 Z"
        onClick={() => step(1)}
      />
    </svg>
  );
}
