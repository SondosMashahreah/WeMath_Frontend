import assert from "node:assert/strict";
import {
  PIECES,
  RADIUS,
  TAU,
  sectorPoints,
  proofPose,
  circlePose,
  rowPose,
  blendPose,
} from "../src/lib/geometry.js";
function area(points) {
  return Math.abs(
    points.reduce((sum, p, i) => {
      const q = points[(i + 1) % points.length];
      return sum + p.x * q.y - q.x * p.y;
    }, 0) / 2,
  );
}
const ideal = Math.PI * RADIUS * RADIUS;
let maxAreaError = 0,
  maxMotionStep = 0;
for (let k = 315; k <= 800; k++) {
  const p = k / 1000;
  let sum = 0;
  for (let i = 0; i < PIECES; i++) {
    const pose = proofPose(i, p),
      pts = sectorPoints(pose, PIECES, RADIUS, 64);
    assert(Object.values(pose).every(Number.isFinite));
    pts
      .slice(1)
      .forEach((pt) =>
        assert(
          Math.abs(Math.hypot(pt.x - pose.x, pt.y - pose.y) - RADIUS) < 1e-8,
          "sector radius changed during rearrangement",
        ),
      );
    sum += area(pts);
    const next = proofPose(i, p + 0.0001);
    maxMotionStep = Math.max(
      maxMotionStep,
      Math.hypot(next.x - pose.x, next.y - pose.y),
    );
  }
  maxAreaError = Math.max(maxAreaError, Math.abs(sum - ideal) / ideal);
}
assert(maxAreaError < 0.000002, "rearrangement must conserve area");
assert(maxMotionStep < 2, "animation must be continuous");
for (let i = 0; i < PIECES; i++) {
  const a = proofPose(i, 0.68),
    b = circlePose(i);
  assert(Math.hypot(a.x - b.x, a.y - b.y) < 1e-10);
  assert(Math.abs(Math.cos(a.angle) - Math.cos(b.angle)) < 1e-10);
  assert(Math.abs(Math.sin(a.angle) - Math.sin(b.angle)) < 1e-10);
}
const angles = Array.from(
  { length: PIECES },
  (_, i) => circlePose(i).angle,
).sort((a, b) => a - b);
for (let i = 1; i < angles.length; i++)
  assert(
    Math.abs(angles[i] - angles[i - 1] - TAU / PIECES) < 1e-10,
    "circle must have no missing/overlapping sectors",
  );
for (const n of [8, 16, 32, 64])
  for (let i = 0; i < n; i++)
    for (const t of [0, 0.3, 0.7, 1]) {
      const pose = blendPose(circlePose(i, n), rowPose(i, n, 100), t);
      const exactPolygonArea = 0.5 * 10000 * 64 * Math.sin(TAU / n / 64);
      assert(
        Math.abs(area(sectorPoints(pose, n, 100, 64)) - exactPolygonArea) <
          1e-7,
        "rigid transformation must preserve tessellated area",
      );
    }
console.log(
  JSON.stringify(
    {
      passed: true,
      sectors: PIECES,
      frames: 486,
      maxAreaError,
      maxMotionStep,
      checks: [
        "constant sector radii",
        "area conservation",
        "complete non-overlapping circle",
        "continuity",
        "sector rearrangement",
      ],
    },
    null,
    2,
  ),
);
