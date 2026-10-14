import assert from "node:assert/strict";
import {
  medallionOutline, DISC_RADIUS, STORY_DURATION, INTRO_DURATION,
  introProofProgress, stageAt, cameraBounds, HIVE_ITEMS, hiveLayout, ENTRANCE_DELAY,
} from "../src/lib/beeConfig.js";

const signedArea = points => points.reduce((area, p, i) => {
  const q = points[(i + 1) % points.length];
  return area + p.x * q.y - q.x * p.y;
}, 0) / 2;
const hexArea = 3 * Math.sqrt(3) / 2 * DISC_RADIUS ** 2;
const discArea = Math.PI * DISC_RADIUS ** 2;
let previous = null;
for (let frame = 0; frame <= 200; frame++) {
  const outline = medallionOutline(frame / 200);
  const area = signedArea(outline);
  assert.equal(outline.length, 96, "vertex count must remain constant during morphing");
  assert(area >= hexArea - 1e-8 && area <= discArea, "solid must stay between the circle and hexagon areas");
  outline.forEach((p, i) => {
    const q = outline[(i + 1) % outline.length], r = outline[(i + 2) % outline.length];
    assert(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert((q.x - p.x) * (r.y - q.y) - (q.y - p.y) * (r.x - q.x) >= -1e-8,
      "boundary must remain convex and counterclockwise");
    if (previous) assert(Math.hypot(p.x - previous[i].x, p.y - previous[i].y) < 0.002,
      "the circle-to-hexagon morph must be continuous");
  });
  previous = outline;
}
assert(Math.abs(signedArea(previous) - hexArea) < 1e-8, "final outline must be a regular hexagon");
assert.equal(stageAt(0), "wordmark");
assert.equal(stageAt(13.5 + ENTRANCE_DELAY), "circle");
assert.equal(stageAt(STORY_DURATION), "ready");
assert(INTRO_DURATION > 0);
assert.equal(introProofProgress(12.5), 0.66, "complete the circle before replacing its sectors with a solid disc");
assert.equal(new Set(HIVE_ITEMS.map(item => item.id)).size, 10);
for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [844, 390], [1195, 672], [1366, 900]]) {
  const bounds = cameraBounds(width, height);
  const layout = hiveLayout(width, height);
  for (const item of HIVE_ITEMS) {
    const { x, y } = item[layout.mode];
    assert(Math.abs(x) + layout.tileRadius < bounds.width / 2, "menu exceeds the camera width");
    assert(Math.abs(y) + layout.tileRadius < bounds.height / 2, "menu exceeds the camera height");
  }
}
console.log("Bee geometry passed: 201 convex closed outlines, continuous morph, exact final hexagon, circle-first timing, ten cells and responsive bounds.");
