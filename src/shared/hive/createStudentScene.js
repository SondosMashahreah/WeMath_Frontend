import * as THREE from "three";
import gsap from "gsap";
import { BEE_THEME, DISC_RADIUS, DESKTOP_FLIP_DURATION, between, cameraBounds, medallionOutline } from "../../lib/beeConfig.js";
import { createHiveRenderer, createHivePrimitives } from "../../scene/hive/rendering.js";
import { createHiveProjection } from "../../scene/hive/projection.js";
import { createSmallHive } from "../../scene/smallHive.js";
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
  const AUTO_FLIP_DELAY = 2;
  const AUTO_FLIP_INTERVAL = 12;
  const AUTO_FLIP_STAGGER = 0.25;
  const AUTO_FLIP_VISIBLE_HOLD = 2;
  let items = [];
  let autoFlipStartedAt = Number.POSITIVE_INFINITY;
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
    autoFlipStartedAt = Number.POSITIVE_INFINITY;
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
    autoFlipStartedAt = reduced
      ? Number.POSITIVE_INFINITY
      : performance.now() / 1000 + AUTO_FLIP_DELAY;
    if (!reduced) gsap.to(entrance, { value: 1, duration: .5, ease: "power2.out" });
  }

  function getAutoFlipRank(button) {
  const ordered = [...hive.buttons].sort((a, b) => {
    const aPos = design.cells[a.item.id];
    const bPos = design.cells[b.item.id];

    if (design.mobile) {
      // Mobile: top -> bottom
      return aPos.y - bPos.y || aPos.x - bPos.x;
    }

    // Desktop: left -> right
    return aPos.x - bPos.x || aPos.y - bPos.y;
  });

  return ordered.findIndex(
    candidate => candidate.item.id === button.item.id
  );
}

  function updateFlip(button, index, now) {
    const hoverTarget = pointerMedia.matches && hovered === button.item.id;
    const autoEnabled = !reduced
      && (!pointerMedia.matches || !hovered)
      && Number.isFinite(autoFlipStartedAt);
    const cycle = autoEnabled && now >= autoFlipStartedAt
      ? (now - autoFlipStartedAt) % AUTO_FLIP_INTERVAL
      : -1;
   const count = hive.buttons.length;

const forwardRank = getAutoFlipRank(button);
const reverseRank = count - 1 - forwardRank;

const forwardStart =
  forwardRank * AUTO_FLIP_STAGGER;

const reverseBase =
  (count - 1) * AUTO_FLIP_STAGGER +
  DESKTOP_FLIP_DURATION +
  AUTO_FLIP_VISIBLE_HOLD;

const reverseStart =
  reverseBase +
  reverseRank * AUTO_FLIP_STAGGER;

const autoTarget =
  cycle >= forwardStart &&
  cycle < reverseStart;
  
  const target = hoverTarget || autoTarget ? 1 : 0;

    if (reduced) {
      gsap.killTweensOf(button.flip);
      button.flip.value = hoverTarget ? 1 : 0;
      button.flipTarget = button.flip.value;
    } else if (button.flipTarget !== target) {
      button.flipTarget = target;
      gsap.killTweensOf(button.flip);
      gsap.to(button.flip, {
        value: target,
        duration: DESKTOP_FLIP_DURATION,
        ease: "power2.inOut",
      });
    }
  }

  function frame() {
    if (disposed) return;
    if (hive) {
      const now = performance.now() / 1000;
      position(emblem, design.center, DISC_RADIUS);
      emblem.position.z = hovered === "center" ? .05 : 0;
      for (const [i, button] of hive.buttons.entries()) {
        const progress = between(entrance.value, i * .01, .78 + i * .01);
        button.progress = progress;
        button.group.visible = progress > .001;
        position(button.group, design.cells[button.item.id], 1, Math.max(progress, .001));
        updateFlip(button, i, now);
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
  }
  const observer = new ResizeObserver(resize); observer.observe(host.parentElement || host);
  const visibility = () => {
    cancelAnimationFrame(raf);
    if (document.hidden) {
      autoFlipStartedAt = Number.POSITIVE_INFINITY;
      return;
    }
    if (!reduced && hive) autoFlipStartedAt = performance.now() / 1000 + AUTO_FLIP_DELAY;
    raf = requestAnimationFrame(frame);
  };
  const pointerChange = () => {
    hover(null);
    autoFlipStartedAt = !reduced && hive
      ? performance.now() / 1000 + AUTO_FLIP_DELAY
      : Number.POSITIVE_INFINITY;
  };
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility);
  pointerMedia.addEventListener("change", pointerChange);
  resize(); raf = requestAnimationFrame(frame);
  return {
    setItems, hover,
    setReduced(value) {
      reduced = value;
      if (value) {
        gsap.killTweensOf(entrance);
        entrance.value = 1;
        autoFlipStartedAt = Number.POSITIVE_INFINITY;
      } else if (hive) {
        autoFlipStartedAt = performance.now() / 1000 + AUTO_FLIP_DELAY;
      }
    },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      pointerMedia.removeEventListener("change", pointerChange);
      releaseContent(); permanent.dispose(); rendering.dispose();
    },
  };
}
