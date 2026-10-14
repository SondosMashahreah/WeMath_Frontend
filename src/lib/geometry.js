export const TAU = Math.PI * 2;
export const PIECES = 32;
export const RADIUS = 172;
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const range = (p, a, b) => ease((p - a) / (b - a));
export function rowPose(i, n, radius = RADIUS) {
  const w = radius * Math.sin(Math.PI / n);
  const h = radius * Math.cos(Math.PI / n);
  return {
    x: (i - (n - 1) / 2) * w,
    y: ((i % 2 ? 1 : -1) * h) / 2,
    angle: i % 2 ? -Math.PI / 2 : Math.PI / 2,
  };
}
// Keep each sector in the same color row and left-to-right order from the
// eight coarse wedges through the refined strip and the final semicircles.
function coarseSlot(i) {
  const group = Math.floor(i / 8) * 2 + i % 2;
  const order = Math.floor((i % 8) / 2);
  return { group, sub: group % 2 ? order : 3 - order, order };
}
export function coarsePose(i) {
  const { group, sub } = coarseSlot(i);
  const pose = rowPose(group, 8);
  return {
    ...pose,
    angle: pose.angle - Math.PI / 8 + ((sub + 0.5) * TAU) / PIECES,
  };
}
export function circlePose(i, n = PIECES, gap = 0) {
  const sign = i % 2 ? -1 : 1;
  return {
    x: 0,
    y: sign * gap,
    angle: sign * (Math.PI - ((Math.floor(i / 2) + 0.5) * TAU) / n),
  };
}
export function blendPose(a, b, t) {
  let delta = b.angle - a.angle;
  while (delta > Math.PI) delta -= TAU;
  while (delta < -Math.PI) delta += TAU;
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    angle: a.angle + delta * t,
  };
}
// Adjacent sectors share an arc endpoint throughout the fold. Their apex
// positions follow that hinge constraint instead of independent straight-line
// interpolation, which made the solid pieces pass through one another.
function hingedRow(k, count, fold, sign) {
  const alpha = Math.PI / PIECES;
  const delta = 2 * alpha * fold;
  const offset = ((count - 1) / 2 - k) * delta;
  const w = RADIUS * Math.sin(alpha);
  // Analytic straight-row limit avoids division by zero at fold = 0.
  if (fold < 1e-7) return {
    x: (k - (count - 1) / 2) * 2 * w,
    y: 0,
    angle: sign * Math.PI / 2,
    width: count * 2 * w,
  };
  const distance = RADIUS * Math.sin(alpha - delta / 2) / Math.sin(delta / 2);
  const edge = (count - 1) / 2 * delta;
  return {
    x: -distance * Math.sin(offset),
    y: sign * distance * (Math.cos(offset) - Math.cos(edge)),
    angle: sign * (Math.PI / 2 + offset),
    width: 2 * (distance * Math.sin(edge) + RADIUS * Math.sin(edge + alpha)),
  };
}
export function proofPose(i, p) {
  const sign = i % 2 ? -1 : 1;
  const w = RADIUS * Math.sin(Math.PI / PIECES);
  const h = RADIUS * Math.cos(Math.PI / PIECES);
  const coarseW = RADIUS * Math.sin(Math.PI / 8);
  const coarseH = RADIUS * Math.cos(Math.PI / 8);
  const { group, order } = coarseSlot(i);

  // Separate the coarse rows outward before spreading their four sectors.
  if (p < 0.333) {
    const pose = coarsePose(i);
    return { ...pose, y: pose.y + sign * (coarseH / 2 + 10) * range(p, 0.315, 0.333) };
  }
  if (p < 0.362) {
    const q = range(p, 0.333, 0.362);
    const local = hingedRow(order, 4, 1 - q, sign);
    return {
      x: (Math.floor(group / 2) - 1.5) * local.width - sign * mix(coarseW, w, q) / 2 + local.x,
      y: sign * 10 + local.y,
      angle: local.angle,
    };
  }
  // Return the now-parallel rows to a clean interleaved rectangle.
  if (p < 0.38) {
    return { ...rowPose(i, PIECES), y: sign * mix(10, -h / 2, range(p, 0.362, 0.38)) };
  }
  if (p < 0.455) {
    const row = rowPose(i, PIECES);
    return { ...row, y: row.y + sign * 94 * range(p, 0.405, 0.455) };
  }
  // Bend each separated row into an outward-facing semicircle. Every pair of
  // neighboring pieces keeps its shared endpoint and cannot cross positions.
  if (p < 0.585) {
    const q = range(p, 0.455, 0.585);
    const local = hingedRow(Math.floor(i / 2), PIECES / 2, q, sign);
    return {
      x: local.x - sign * w / 2 * (1 - q),
      y: local.y + sign * mix(94 - h / 2, 82, q),
      angle: local.angle,
    };
  }
  return circlePose(i, PIECES, 82 * (1 - range(p, 0.6, 0.66)));
}
export function sectorPoints(pose, n = PIECES, radius = RADIUS, samples = 9) {
  const pts = [{ x: pose.x, y: pose.y }];
  for (let j = 0; j <= samples; j++) {
    const a = pose.angle - Math.PI / n + ((j / samples) * TAU) / n;
    pts.push({
      x: pose.x + Math.cos(a) * radius,
      y: pose.y + Math.sin(a) * radius,
    });
  }
  return pts;
}
export function schematicPoints(i) {
  // Subdivisions of the eight triangles keep every later sector identifiable.
  const group = Math.floor(i / 4),
    sub = i % 4;
  const apex = { x: (group - 3.5) * 72, y: group % 2 ? 88 : -88 };
  const l = apex.x - 72 + sub * 36,
    r = l + 36;
  const baseY = -apex.y;
  return [
    apex,
    ...Array.from({ length: 10 }, (_, j) => ({
      x: mix(l, r, j / 9),
      y: baseY,
    })),
  ];
}

// The same boundary is used by the scene and the collision regression check.
// Preserve the vertex correspondence as the W/M sketch becomes real sectors.
export function proofPoints(i, p) {
  if (p >= 0.315) return sectorPoints(proofPose(i, p));
  const { group, sub } = coarseSlot(i);
  let schematic = schematicPoints(group * 4 + (group % 2 ? sub : 3 - sub));
  if (group % 2 === 0) schematic = [schematic[0], ...schematic.slice(1).reverse()];
  const exact = sectorPoints(coarsePose(i));
  const u = range(p, 0.28, 0.315);
  return schematic.map((v, j) => ({ x: mix(v.x, exact[j].x, u), y: mix(v.y, exact[j].y, u) }));
}
