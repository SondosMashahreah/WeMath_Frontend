import * as THREE from "three";
import gsap from "gsap";
import { BEE_THEME, DISC_RADIUS, DESKTOP_FLIP_DURATION, between, cameraBounds, medallionOutline } from "../../../lib/beeConfig.js";
import { createHiveRenderer, createHivePrimitives } from "../../../scene/hive/rendering.js";
import { createHiveProjection } from "../../../scene/hive/projection.js";
import { createSmallHive } from "../../../scene/smallHive.js";
import { studentLayout } from "./studentLayout.js";

// Rendering adapter: receives display items, never credentials or curriculum.
export function createStudentScene({ canvas, host, hitTargets, reduced = false }) {
  const rendering = createHiveRenderer(canvas);
  const { scene, camera, renderer } = rendering;
  const permanent = createHivePrimitives();
  const shadow = new THREE.ShadowMaterial({ color: 0x715238, opacity: .14 });
  permanent.materials.add(shadow);
  const wall = permanent.mesh(new THREE.PlaneGeometry(70, 70), shadow, scene, [0, 0, -1.4]);
  wall.castShadow = false;
  const pointerMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
  let content, resources, hive, emblem, design, width = 1, height = 1, hovered = null, disposed = false, raf = 0;
  let items = [];
  const entrance = { value: 1 };
  const { placeHit, placeFace } = createHiveProjection({ camera, hitTargets, getSize: () => ({ width, height }) });

  function resize() {
    width = Math.max(host.clientWidth, 1);
    const viewportHeight = host.parentElement?.clientHeight || window.innerHeight;
    design = studentLayout(width, viewportHeight, items);
    height = design.height;
    host.style.height = `${height}px`;
    host.dataset.layout = "desktop";
    host.dataset.mobile = String(design.mobile);
    renderer.setSize(width, height, false);
    const bounds = cameraBounds(width, height);
    camera.left = -bounds.width / 2; camera.right = bounds.width / 2;
    camera.top = bounds.height / 2; camera.bottom = -bounds.height / 2;
    camera.updateProjectionMatrix();
    hive?.applyLayout({ desktopMenu: true, design });
  }
  function position(object, box, radius, progress = 1) {
    const unit = (camera.right - camera.left) / width;
    object.position.set((box.x - width / 2) * unit, (height / 2 - box.y) * unit, 0);
    const sx = box.width * unit / (2 * radius), sy = box.height * unit / (Math.sqrt(3) * radius);
    object.scale.set(sx * progress, sy * progress, sx * progress);
  }
  function releaseContent() {
    gsap.killTweensOf(entrance);
    hive?.buttons.forEach(button => gsap.killTweensOf(button.flip));
    if (content) scene.remove(content);
    hive?.dispose(); resources?.dispose();
    hive = null;
  }
  function setItems(next) {
    releaseContent();
    items = next; hovered = null;
    resize();
    content = new THREE.Group(); scene.add(content);
    resources = createHivePrimitives();
    const { mesh, material, prism, tube } = resources;
    const gold = material(BEE_THEME.honeyLight, { metalness: .55, roughness: .24 });
    emblem = new THREE.Group(); emblem.name = "student-center"; content.add(emblem);
    mesh(prism(medallionOutline(1), .32, .045), material(BEE_THEME.honey), emblem);
    tube(medallionOutline(1, DISC_RADIUS * .96, 60).map(v => [v.x, v.y, .21]), .012, gold, emblem, true);
    hive = createSmallHive({ world: content, mesh, material, prism, tube, gold, items, design });
    hive.applyLayout({ desktopMenu: true, design });
    entrance.value = reduced ? 1 : 0;
    if (!reduced) gsap.to(entrance, { value: 1, duration: .5, ease: "power2.out" });
  }
  function frame() {
    if (disposed) return;
    if (hive) {
      position(emblem, design.center, DISC_RADIUS);
      emblem.position.z = hovered === "center" ? .05 : 0;
      for (const [i, button] of hive.buttons.entries()) {
        const progress = between(entrance.value, i * .01, .78 + i * .01);
        button.progress = progress;
        button.group.visible = progress > .001;
        position(button.group, design.cells[button.item.id], 1, Math.max(progress, .001));
        button.pivot.rotation.y = -Math.PI * button.flip.value;
      }
      scene.updateMatrixWorld();
      placeHit("center", emblem, DISC_RADIUS, .22);
      for (const button of hive.buttons) {
        const hit = placeHit(button.item.id, button.group, 1, .16, button.progress);
        if (!hit) continue;
        hive.syncContrast(button, hit.element);
        placeFace(hit.element.querySelector(".bee-cell-front"), button.front, hit);
        placeFace(hit.element.querySelector(".bee-cell-back"), button.back, hit);
      }
    }
    renderer.render(scene, camera);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  }
  function hover(id) {
    hovered = id;
    if (!hive) return;
    for (const button of hive.buttons) {
      const target = pointerMedia.matches && button.item.id === id ? 1 : 0;
      gsap.killTweensOf(button.flip);
      if (reduced) button.flip.value = target;
      else gsap.to(button.flip, { value: target, duration: DESKTOP_FLIP_DURATION, ease: "power2.inOut" });
    }
  }
  const observer = new ResizeObserver(resize); observer.observe(host.parentElement || host);
  const visibility = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(frame); };
  const pointerChange = () => hover(null);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility);
  pointerMedia.addEventListener("change", pointerChange);
  resize(); raf = requestAnimationFrame(frame);
  return {
    setItems, hover,
    setReduced(value) { reduced = value; if (value) { gsap.killTweensOf(entrance); entrance.value = 1; hover(hovered); } },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      pointerMedia.removeEventListener("change", pointerChange);
      releaseContent(); permanent.dispose(); rendering.dispose();
    },
  };
}
