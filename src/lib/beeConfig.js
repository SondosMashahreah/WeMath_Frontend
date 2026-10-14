// Labels, line breaks and positions. Icons live in components/HiveIcon.jsx.
export const HIVE_ITEMS = [
  {
    id: "assistant", label: "المساعد الذكي",
    lines: ["المساعد", "الذكي"],
    desktop: { x: -1.88, y: 2.32 },
    mobile: { x: -1.6, y: 2.33 },
  },
  {
    id: "workshops", label: "الورشات",
    lines: ["الورشات"],
    desktop: { x: -3.25, y: 0.83 },
    mobile: { x: -2.85, y: 0.92 },
  },
  {
    id: "students", label: "الطلاب",
    lines: ["الطلاب"],
    desktop: { x: -3.25, y: -0.83 },
    mobile: { x: -2.85, y: -0.92 },
  },
  {
    id: "teachers", label: "المعلمين",
    lines: ["المعلمين"],
    desktop: { x: -1.88, y: -2.32 },
    mobile: { x: -1.6, y: -2.33 },
  },
  {
    id: "parents", label: "الاهل",
    lines: ["الاهل"],
    desktop: { x: 1.88, y: 2.32 },
    mobile: { x: 1.6, y: 2.33 },
  },
  {
    id: "guest", label: "ضيف",
    lines: ["ضيف"],
    desktop: { x: 3.25, y: 0.83 },
    mobile: { x: 2.85, y: 0.92 },
  },
  {
    id: "competitions", label: "المسابقات",
    lines: ["المسابقات"],
    desktop: { x: 3.25, y: -0.83 },
    mobile: { x: 2.85, y: -0.92 },
  },
  {
    id: "initiatives", label: "المبادرات وقصص النجاح",
    lines: ["المبادرات", "وقصص النجاح"],
    desktop: { x: 1.88, y: -2.32 },
    mobile: { x: 1.6, y: -2.33 },
  },
  {
    id: "research", label: "الابحاث والدراسات",
    lines: ["الابحاث", "والدراسات"],
    desktop: { x: -4.98, y: 0 },
    mobile: { x: 0, y: 4 },
  },
  {
    id: "steam", label: "WE STEAM",
    lines: ["WE STEAM"],
    desktop: { x: 4.98, y: 0 },
    mobile: { x: 0, y: -4 },
  },
];

export const BEE_THEME = {
  background: "#DED3C8",
  honey: "#F72217",
  honeyLight: "#d1b2b0",
  cream: "#F6EDDA",
  ink: "#503E2B",
  edge: "#94622E",
  icon: "#d54b1d",
};

// Both sector colors live here; the completed circle uses BEE_THEME.honey.
export const SECTOR_COLORS = ["#F72217", "#d8b578"];

// Measured from the supplied 1336 × 740 desktop sketch.
// These are design pixels, scaled together to fit the available screen.
// HIVE_ITEMS.mobile and the classic touch layout above stay unchanged.
export const DESKTOP_HIVE = {
  width: 1336,
  height: 740,
  center: { x: 230, y: 369, width: 422, height: 388 },
  cells: {
    assistant: { x: 673.5, y: 251, width: 219, height: 188 },
    workshops: { x: 668.5, y: 456, width: 209, height: 180 },
    students: { x: 853.5, y: 141, width: 219, height: 204 },
    teachers: { x: 848, y: 358.5, width: 232, height: 205 },
    parents: { x: 854, y: 566.5, width: 224, height: 199 },
    guest: { x: 1031.5, y: 251, width: 227, height: 204 },
    competitions: { x: 1040, y: 461, width: 230, height: 198 },
    initiatives: { x: 1208, y: 140.5, width: 224, height: 205 },
    research: { x: 1215, y: 352, width: 228, height: 208 },
    steam: { x: 1217.5, y: 564, width: 213, height: 202 },
  },
};
export const DESKTOP_FLIP_DURATION = 1;

// Seconds, rather than scroll positions. Change INTRO_DURATION to retime everything.
export const INTRO_DURATION = 14;
export const ENTRANCE_DELAY = 0.5;
// Timeline coordinates stay fixed; INTRO_DURATION changes the playback speed.
export const STORY_DURATION = 16.8 + ENTRANCE_DELAY;
export const DISC_RADIUS = 1.95;
export const SECTOR_COUNT = 32;
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export function between(t, from, to) {
  const u = clamp01((t - from) / (to - from));
  return u * u * (3 - 2 * u);
}

// A circle and a flat-topped hexagon share the same sampled boundary.
// All intermediate frames remain closed, convex, solid prisms.
export function medallionOutline(morph, radius = DISC_RADIUS, count = 96) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const sideAngle = (angle % (Math.PI / 3)) - Math.PI / 6;
    const hexRadius = radius * Math.cos(Math.PI / 6) / Math.cos(sideAngle);
    const r = lerp(radius, hexRadius, clamp01(morph));
    return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
  });
}

export function introProofProgress(t) {
  const stops = [[5, 0.27], [6.5, 0.315], [7.8, 0.38], [8.4, 0.405], [9.25, 0.455], [11.3, 0.585], [12.5, 0.66]];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) return lerp(stops[i - 1][1], stops[i][1], between(t, stops[i - 1][0], stops[i][0]));
  }
  return 0.66;
}

export function stageAt(seconds) {
  const t = Math.max(0, seconds - ENTRANCE_DELAY);
  if (t < 1.6) return "wordmark";
  if (t < 5.1) return "letters";
  if (t < 8.4) return "rectangle";
  if (t < 12.5) return "sectors";
  if (t < 14.6) return "circle";
  if (seconds < STORY_DURATION) return "hexagon";
  return "ready";
}

// Match the drawings: extra cells at the sides on desktop, above/below on mobile.
export function isPortraitLayout(width, height) {
  return width < 768 || height > width;
}
export function hiveLayout(width, height, finePointer = true) {
  const portrait = isPortraitLayout(width, height);
  return {
    mode: portrait ? "mobile" : "desktop",
    tileRadius: portrait ? 0.99 : 0.82,
    centerScale: portrait ? 0.77 : 1,
    desktopMenu: !portrait && finePointer,
    desktop: desktopHiveLayout(width, height),
  };
}
export function cameraBounds(width, height) {
  const aspect = Math.max(width, 1) / Math.max(height, 1);
  const portrait = isPortraitLayout(width, height);
  const spanY = portrait ? Math.max(10.2, 8.15 / aspect) : Math.max(7.9, 12.55 / aspect);
  return { width: spanY * aspect, height: spanY };
}

export function desktopHiveLayout(width, height) {
  const reference = DESKTOP_HIVE;
  const fit = Math.min(width / reference.width, height / reference.height);
  const pixelsPerUnit = width / cameraBounds(width, height).width;
  const unit = fit / pixelsPerUnit;
  const position = ({ x, y }) => ({
    x: (x - reference.width / 2) * unit,
    y: (reference.height / 2 - y) * unit,
  });
  return {
    center: position(reference.center),
    centerScale: {
      x: reference.center.width / (2 * DISC_RADIUS) * unit,
      y: reference.center.height / (Math.sqrt(3) * DISC_RADIUS) * unit,
    },
    cells: Object.fromEntries(Object.entries(reference.cells).map(([id, point]) => [id, {
      ...position(point),
      scale: { x: point.width / 2 * unit, y: point.height / Math.sqrt(3) * unit },
    }])),
  };
}
