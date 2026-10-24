import * as THREE from "three";
import { between } from "../../lib/beeConfig.js";

export function createHiveProjection({ camera, hitTargets, getSize }) {
  // HTML keeps Arabic shaping and React Icons editable. Project it onto the
  // actual face plane, including its rotation and scale, rather than guessing.
  const projection = new THREE.Vector3();
  function projectPoint(object, x, y, z) {
    const { width, height } = getSize();
    projection.set(x, y, z).applyMatrix4(object.matrixWorld).project(camera);
    return { x: (projection.x * 0.5 + 0.5) * width, y: (0.5 - projection.y * 0.5) * height };
  }
  function placeHit(id, object, radius, depth, progress = 1) {
    const button = hitTargets.current[id];
    if (!button) return;
    const halfHeight = radius * Math.sqrt(3) / 2;
    const a = projectPoint(object, -radius, halfHeight, depth);
    const b = projectPoint(object, radius, halfHeight, depth);
    const c = projectPoint(object, -radius, -halfHeight, depth);
    const size = Math.max(0.1, Math.hypot(b.x - a.x, b.y - a.y));
    const h = size * Math.sqrt(3) / 2;
    button.style.width = `${size}px`;
    button.style.height = `${h}px`;
    button.style.setProperty("--cell-size", `${size}px`);
    button.style.transform = `matrix(${(b.x-a.x)/size},${(b.y-a.y)/size},${(c.x-a.x)/h},${(c.y-a.y)/h},${a.x},${a.y})`;
    button.style.opacity = between(progress, 0.5, 1);
    button.inert = progress < 0.85;
    return { element: button, size, height: h, matrix: [(b.x-a.x)/size, (b.y-a.y)/size, (c.x-a.x)/h, (c.y-a.y)/h, a.x, a.y] };
  }

  // Project each face independently, then express it inside the stable button.
  // This keeps Arabic and React Icons editable and legible on the actual 3D
  // front/back surfaces; the back text is never shown mirrored through the tile.
  const faceNormal = new THREE.Vector3();
  function placeFace(element, object, hit) {
    if (!element) return;
    const a = projectPoint(object, -1, Math.sqrt(3) / 2, 0);
    const b = projectPoint(object, 1, Math.sqrt(3) / 2, 0);
    const c = projectPoint(object, -1, -Math.sqrt(3) / 2, 0);
    const matrix = [(b.x-a.x)/hit.size, (b.y-a.y)/hit.size, (c.x-a.x)/hit.height, (c.y-a.y)/hit.height, a.x, a.y];
    const [aa, ab, ac, ad, ax, ay] = hit.matrix;
    const determinant = aa * ad - ab * ac;
    if (Math.abs(determinant) < 0.00001) { element.style.visibility = "hidden"; return; }
    const [ba, bb, bc, bd, bx, by] = matrix;
    const relative = [
      (ad*ba-ac*bb)/determinant, (aa*bb-ab*ba)/determinant,
      (ad*bc-ac*bd)/determinant, (aa*bd-ab*bc)/determinant,
      (ad*(bx-ax)-ac*(by-ay))/determinant, (aa*(by-ay)-ab*(bx-ax))/determinant,
    ];
    element.style.transform = `matrix(${relative.join(",")})`;
    element.style.visibility = object.getWorldDirection(faceNormal).z > 0.045 ? "visible" : "hidden";
  }

  return { placeHit, placeFace };
}
