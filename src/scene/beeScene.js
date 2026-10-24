import * as THREE from "three";
import gsap from "gsap";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import fontData from "three/examples/fonts/helvetiker_bold.typeface.json";
import { proofPoints } from "../lib/geometry.js";
import { BEE_THEME, INTRO_DURATION, STORY_DURATION, DISC_RADIUS, SECTOR_COUNT, SECTOR_COLORS, DESKTOP_FLIP_DURATION, between, lerp, medallionOutline, introProofProgress, stageAt, cameraBounds, hiveLayout, ENTRANCE_DELAY } from "../lib/beeConfig.js";

import { createSmallHive } from "./smallHive.js";
import { createHiveRenderer, createHivePrimitives } from "./hive/rendering.js";
import { createHiveProjection } from "./hive/projection.js";

const font = new FontLoader().parse(fontData);

/** The automatic 3D introduction and ten display-only honeycomb cells. */
export function createBeeScene({ canvas, host, hitTargets, onStage, onFinish, onMenu, reduced = false }) {
  let disposed = false, raf = 0, width = 1, height = 1, lastTime = 0;
  let opened = false, finished = false, hovered = null, active = true;
  const pointerMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
  let lastStage = "", layout = hiveLayout(1366, 900);
  const clock = { seconds: 0 }, expansion = { value: 0 };
  const pointer = new THREE.Vector2(), viewPointer = new THREE.Vector2();
  const rendering = createHiveRenderer(canvas);
  const { renderer, scene, camera } = rendering;
  const resources = createHivePrimitives();
  const { mesh, material, tube, prism, updatePrism, materials } = resources;
  const honey = material(BEE_THEME.honey), cream = material(BEE_THEME.cream);
  const gold = material(BEE_THEME.honeyLight, { metalness: 0.55, roughness: 0.24 });
  function text(value, size, parent, m = cream, depth = 0.025) {
    const g = new TextGeometry(value, { font, size, depth, curveSegments: 5, bevelEnabled: true, bevelThickness: Math.min(0.008, size * 0.025), bevelSize: Math.min(0.006, size * 0.02), bevelSegments: 2 });
    g.computeBoundingBox();
    const box = g.boundingBox;
    g.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);
    return mesh(g, m, parent);
  }
  const world = new THREE.Group();
  scene.add(world);
  const shadow = new THREE.ShadowMaterial({ color: 0x715238, opacity: 0 });
  materials.add(shadow);
  const wall = mesh(new THREE.PlaneGeometry(70, 70), shadow, scene, [0, 0, -1.4]);
  wall.castShadow = false;

  // Opening: individual solid letters. W and M are articulated solid strokes.
  const word = new THREE.Group();
  world.add(word);
  const wordFront = material(BEE_THEME.honey);
  const wordSide = material(BEE_THEME.edge);
  const strokeMaterial = material(BEE_THEME.honey, { transparent: true });
  const letterMaterials = [wordFront, wordSide];
  // A narrow highlight travels across the same 3D letters, after their entrance.
  const shine = { value: 0 }, shineX = { value: -5 };
  for (const m of [wordFront, wordSide, strokeMaterial]) {
    m.onBeforeCompile = shader => {
      shader.uniforms.uShine = shine;
      shader.uniforms.uShineX = shineX;
      shader.vertexShader = "varying vec3 vWordPosition;\n" + shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvWordPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
      shader.fragmentShader = "uniform float uShine;\nuniform float uShineX;\nvarying vec3 vWordPosition;\n" + shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float offset = (vWordPosition.x + vWordPosition.y * 0.38 - uShineX) * 2.8;
        float band = exp(-offset * offset) * uShine;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.95, 0.80), band * 0.8);
        totalEmissiveRadiance += vec3(1.0, 0.86, 0.57) * band * 0.55;`,
      );
    };
    m.customProgramCacheKey = () => "we-math-word-shine";
  }
  const wordLetters = [];
  const glyphSpecs = ["W", "E", " ", "M", "A", "T", "H"];
  let wordWidth = 0;
  for (const char of glyphSpecs) {
    if (char === " ") { wordWidth += 0.4; continue; }
    const obj = char === "W" || char === "M" ? new THREE.Group() : text(char, 1.1, word, letterMaterials, 0.24);
    let size = 1.12;
    if (obj.geometry) { obj.geometry.computeBoundingBox(); size = obj.geometry.boundingBox.max.x - obj.geometry.boundingBox.min.x; }
    if (char === "W" || char === "M") {
      word.add(obj);
      for (let i = 0; i < 4; i++) mesh(new RoundedBoxGeometry(0.155, 1, 0.24, 2, 0.03), strokeMaterial, obj);
      for (let i = 0; i < 5; i++) {
        const joint = mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.24, 16), strokeMaterial, obj);
        joint.rotation.x = Math.PI / 2;
      }
    }
    obj.position.x = wordWidth + size / 2;
    wordWidth += size + 0.16;
    wordLetters.push({ char, obj, size, startX: obj.position.x });
  }
  wordWidth -= 0.16;
  for (const glyph of wordLetters) { glyph.startX -= wordWidth / 2; glyph.obj.position.x = glyph.startX; }
  const wShape = [[-0.5, 0.56], [-0.27, -0.56], [0, 0.13], [0.27, -0.56], [0.5, 0.56]];
  const mShape = [[-0.5, -0.56], [-0.5, 0.56], [0, -0.21], [0.5, 0.56], [0.5, -0.56]];
  function renderWord(t) {
    word.visible = t < 6.1;
    if (!word.visible) return;
    const entrance = Math.min(1, clock.seconds / 1.05);
    const back = 1 + 2.70158 * (entrance - 1) ** 3 + 1.70158 * (entrance - 1) ** 2;
    word.scale.setScalar(Math.max(0.001, back));
    word.position.y = -0.28 * (1 - between(clock.seconds, 0, 1.05));
    word.rotation.x = 0.35 * (1 - between(clock.seconds, 0, 1.05));
    shine.value = between(clock.seconds, 1.08, 1.22) * (1 - between(clock.seconds, 1.98, 2.15));
    shineX.value = lerp(-4.5, 4.5, between(clock.seconds, 1.08, 2.15));
    const focus = between(t, 1.65, 3.3), morph = between(t, 3.25, 5.2), vanish = 1 - between(t, 5.35, 6.1);
    strokeMaterial.opacity = vanish;
    for (const glyph of wordLetters) {
      if (glyph.char !== "W" && glyph.char !== "M") {
        const fade = 1 - between(t, 1.6, 2.6);
        glyph.obj.visible = fade > 0.001;
        glyph.obj.scale.setScalar(Math.max(0.001, fade));
        glyph.obj.position.y = (1 - fade) * 0.5;
        continue;
      }
      glyph.obj.position.x = 0;
      const path = glyph.char === "W" ? wShape : mShape;
      const indexOffset = glyph.char === "W" ? 0 : 4;
      const points = path.map(([x, y], i) => {
        const a = glyph.char === "M" ? -Math.PI * focus : 0;
        const fx = (x * Math.cos(a) - y * Math.sin(a)) * 1.42 + (glyph.char === "W" ? -1.5 : 1.5);
        const fy = (x * Math.sin(a) + y * Math.cos(a)) * 1.42;
        return new THREE.Vector3(lerp(lerp(x + glyph.startX, fx, focus), (i + indexOffset - 3.5) * (72 / 172 * DISC_RADIUS), morph), lerp(lerp(y, fy, focus), (i % 2 ? -1 : 1) * 88 / 172 * DISC_RADIUS, morph), 0.04);
      });
      glyph.obj.visible = vanish > 0.001;
      for (let i = 0; i < 4; i++) {
        const a = points[i], b = points[i + 1], object = glyph.obj.children[i];
        object.position.copy(a).add(b).multiplyScalar(0.5);
        object.scale.y = a.distanceTo(b);
        object.rotation.z = -Math.atan2(b.x - a.x, b.y - a.y);
      }
      for (let i = 0; i < 5; i++) glyph.obj.children[i + 4].position.copy(points[i]);
    }
  }

  const proof = new THREE.Group();
  proof.name = "intro-proof";
  world.add(proof);
  const sectorMats = SECTOR_COLORS.map(color => material(color, { transparent: true }));
  const sectors = Array.from({ length: SECTOR_COUNT }, (_, i) => {
    const shape = proofPoints(i, 0.27).map(v => ({ x: v.x / 172 * DISC_RADIUS, y: -v.y / 172 * DISC_RADIUS })).reverse();
    const object = mesh(prism(shape, 0.24, 0.008), sectorMats[i % 2], proof);
    object.name = `intro-sector-${i}`;
    return object;
  });
function renderProof(t) {
  proof.visible = t >= 5.05 && t < 13.08;
  if (!proof.visible) return;

  const originalP = introProofProgress(t);

  const strength = between(t, 5.05, 5.75);
  const union = between(t, 12.1, 12.9);

  sectorMats.forEach(m => {
    m.opacity = strength;
  });

  sectorMats[0].color
    .set(SECTOR_COLORS[0])
    .lerp(new THREE.Color(BEE_THEME.honey), union);

  sectorMats[1].color
    .set(SECTOR_COLORS[1])
    .lerp(new THREE.Color(BEE_THEME.honey), union);

  // 1) scatter
  const scatterOut = between(t, 5.05, 5.8);

  // 2) الرجوع للمستطيل
  const settle = between(t, 5.8, 7.3);

  // 3) بعد ما يكتمل المستطيل نرجع للحركة الأصلية
  const continueOriginal = between(t, 7.3, 8.0);

  // p = 0.38 هو وضع المستطيل المرتب في geometry.js
  const rectangleP = 0.38;

  // خلال التناثر والرجوع: نثبت الشكل على المستطيل
  // وبعدها نسمح للأنيميشن الأصلي يكمل
  const p =
    t < 7.3
      ? rectangleP
      : lerp(rectangleP, originalP, continueOriginal);

  sectors.forEach((object, i) => {
    const outline = proofPoints(i, p).map(v => ({
      x: v.x / 172 * DISC_RADIUS,
      y: -v.y / 172 * DISC_RADIUS,
    }));

    outline.reverse();

    updatePrism(
      object.geometry,
      outline,
      0.24,
      0.008 * (1 - union)
    );

    // Scatter offsets
    const center = (SECTOR_COUNT - 1) / 2;
    const fromCenter = i - center;

    const wave1 = Math.sin(i * 2.17);
    const wave2 = Math.cos(i * 1.43);

    const scatterAmount =
      scatterOut * (1 - settle);

    const offsetX =
      Math.sign(fromCenter || 1) *
      (0.15 + Math.abs(fromCenter) * 0.025) *
      scatterAmount;

    const offsetY =
      wave1 *
      0.75 *
      scatterAmount;

    const offsetZ =
      wave2 *
      0.55 *
      scatterAmount;

    object.position.set(
      offsetX,
      offsetY,
      offsetZ
    );

    object.rotation.x =
      wave2 * 0.65 * scatterAmount;

    object.rotation.y =
      wave1 * 0.85 * scatterAmount;

    object.rotation.z =
      wave2 * 0.55 * scatterAmount;
  });
}

  const emblem = new THREE.Group();
  world.add(emblem);
  const face = mesh(prism(medallionOutline(0), 0.32, 0.045), honey, emblem);
  const label = new THREE.Group();
  emblem.add(label);
  const labelTop = text("WE", 0.66, label, cream, 0.06);
  labelTop.position.set(0, 0.48, 0.22);
  const labelBottom = text("MATH", 0.66, label, cream, 0.06);
  labelBottom.position.set(0, -0.38, 0.22);
  const rim = tube(medallionOutline(1, DISC_RADIUS * 0.96, 60).map(v => [v.x, v.y, 0.21]), 0.012, gold, emblem, true);

  const smallHive = createSmallHive({ world, mesh, prism, tube, material, gold });
  const { buttons } = smallHive;

  const { placeHit, placeFace } = createHiveProjection({ camera, hitTargets, getSize: () => ({ width, height }) });

  function updateFlip(button) {
    const target = layout.desktopMenu && opened && hovered === button.item.id ? 1 : 0;
    if (!layout.desktopMenu || reduced) {
      gsap.killTweensOf(button.flip);
      button.flip.value = target;
      button.flipTarget = target;
    } else if (button.flipTarget !== target) {
      button.flipTarget = target;
      gsap.killTweensOf(button.flip);
      gsap.to(button.flip, { value: target, duration: DESKTOP_FLIP_DURATION, ease: "power2.inOut" });
    }
    // Only the inner small-cell panel turns horizontally with its content.
    button.pivot.rotation.y = -Math.PI * button.flip.value;
  }
  let lastMorph = -1;
  function drawIntro() {
    const t = Math.max(0, clock.seconds - ENTRANCE_DELAY);
    const stage = stageAt(clock.seconds);
    if (stage !== lastStage) { lastStage = stage; onStage(stage); }
    renderWord(t); renderProof(t);
    const merge = between(t, 12.82, 13.08);
    emblem.visible = t > 12.82;
    const morph = between(t, 14.6, 16.35);
    if (Math.abs(morph - lastMorph) > 0.00001) { updatePrism(face.geometry, medallionOutline(morph), 0.32, 0.045); lastMorph = morph; }
    // The solid disc grows from within the finished circle, covering its seams.
    face.scale.setScalar(merge);
    const letterIn = between(t, 13.12, 14.3);
    label.visible = letterIn > 0;
    label.scale.setScalar(Math.max(letterIn, 0.001));
    label.position.z = (1 - letterIn) * 0.3;
    rim.visible = morph > 0.99;
    world.rotation.set(lerp(0.04, 0.13, between(t, 2, 6)) * (1 - between(t, 14, 16.8) * 0.5), -0.13 * between(t, 2, 5) + 0.06 * between(t, 14, 16.8), -0.015 * between(t, 5, 7) * (1 - between(t, 14, 16.8)));
    emblem.scale.setScalar(lerp(1, layout.centerScale, between(t, 14.6, 16.8)));
    shadow.opacity = 0.14 * between(t, 2.8, 6);
  }
  function resize() {
    const rect = host.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    width = rect.width; height = rect.height;
    renderer.setSize(width, height, false);
    const bounds = cameraBounds(width, height);
    camera.left = -bounds.width / 2; camera.right = bounds.width / 2;
    camera.top = bounds.height / 2; camera.bottom = -bounds.height / 2;
    camera.updateProjectionMatrix();
    const next = hiveLayout(width, height, pointerMedia.matches);
    if (next.desktopMenu !== layout.desktopMenu) hovered = null;
    layout = next;
    host.dataset.layout = layout.desktopMenu ? "desktop" : "classic";
    smallHive.applyLayout(layout);
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  pointerMedia.addEventListener("change", resize);
  const pointerMove = (event) => { const rect = canvas.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / width * 2 - 1, (event.clientY - rect.top) / height * 2 - 1); };
  const pointerLeave = () => pointer.set(0, 0);
  host.addEventListener("pointermove", pointerMove, { passive: true });
  host.addEventListener("pointerleave", pointerLeave);

  function frame(now) {
    if (disposed || !active) return;
    const dt = Math.min((now - (lastTime || now)) / 1000, 0.05); lastTime = now;
    drawIntro();
    const spread = layout.desktopMenu ? between(expansion.value, 0, 0.74) : 0;
    viewPointer.lerp(reduced ? new THREE.Vector2() : pointer, 1 - Math.exp(-dt * 3.5));
    if (finished && !reduced) {
      world.rotation.x += viewPointer.y * 0.024;
      world.rotation.y += viewPointer.x * 0.04;
    }
    // Straighten the open desktop composition to match the measured reference.
    // The intro and classic/mobile camera movement are unchanged.
    if (layout.desktopMenu) {
      world.rotation.x *= 1 - spread;
      world.rotation.y *= 1 - spread;
      world.rotation.z *= 1 - spread;
      emblem.position.x = layout.desktop.center.x * spread;
      emblem.position.y = layout.desktop.center.y * spread;
      if (finished) emblem.scale.set(
        lerp(layout.centerScale, layout.desktop.centerScale.x, spread),
        lerp(layout.centerScale, layout.desktop.centerScale.y, spread),
        lerp(layout.centerScale, layout.desktop.centerScale.x, spread),
      );
    } else {
      emblem.position.x = 0;
      emblem.position.y = 0;
    }
    buttons.forEach((button, i) => {
      const { item, group, tileMat } = button;
      const progress = layout.desktopMenu
        ? between(expansion.value, 0.22 + i * 0.015, 0.82 + i * 0.015)
        : between(expansion.value, i * 0.022, 0.78 + i * 0.022);
      button.progress = progress;
      const position = layout.desktopMenu ? layout.desktop.cells[item.id] : item[layout.mode];
      group.visible = progress > 0.001;
      group.position.set(position.x * progress, position.y * progress, -0.5 * (1 - progress));
      if (layout.desktopMenu) {
        const size = Math.max(0.001, progress), scale = position.scale;
        group.scale.set(scale.x * size, scale.y * size, scale.x * size);
      } else {
        group.scale.setScalar(layout.tileRadius * Math.max(0.001, progress) * (hovered === item.id ? 1.025 : 1));
      }
      group.rotation.z = (1 - progress) * (position.x > 0 ? -0.3 : 0.3);
      updateFlip(button);
      if (!layout.desktopMenu) tileMat.color.lerp(new THREE.Color(hovered === item.id ? "#FFF8E9" : BEE_THEME.cream), 0.12);
      else tileMat.color.set(BEE_THEME.cream);
    });
    emblem.position.z = hovered === "center" ? 0.05 : 0;
    scene.updateMatrixWorld();
    if (finished) {
      placeHit("center", emblem, DISC_RADIUS, 0.22);
      if (opened) for (const button of buttons) {
        const { item, group, progress, front, back, flip } = button;
        const hit = placeHit(item.id, group, 1, 0.16, progress);
        if (hit) smallHive.syncContrast(button, hit.element);
        if (hit && layout.desktopMenu) {
          placeFace(hit.element.querySelector(".bee-cell-front"), front, hit);
          placeFace(hit.element.querySelector(".bee-cell-back"), back, hit);
          hit.element.dataset.face = flip.value > 0.5 ? "label" : "icon";
        }
      }
    }
    renderer.render(scene, camera);
    if (!document.hidden && active) raf = requestAnimationFrame(frame);
  }
  const timeline = gsap.timeline({ paused: true, onComplete() { finished = true; onFinish(); } });
  timeline.to(clock, { seconds: STORY_DURATION, duration: INTRO_DURATION, ease: "none" });
  function start() {
    clock.seconds = 0; lastStage = ""; finished = false; opened = false; expansion.value = 0;
    hovered = null; onMenu(false);
    gsap.killTweensOf(expansion);
    for (const button of buttons) { gsap.killTweensOf(button.flip); button.flip.value = 0; button.flipTarget = 0; }
    timeline.restart();
    if (reduced) timeline.progress(1);
    if (document.hidden) timeline.pause();
  }
  function skip() { timeline.progress(1).pause(); }
  function toggleMenu() {
    if (!finished) return;
    opened = !opened;
    onMenu(opened);
    gsap.killTweensOf(expansion);
    gsap.to(expansion, { value: opened ? 1 : 0, duration: reduced ? 0 : 1.05, ease: "power2.inOut" });
  }
  const visibility = () => {
    cancelAnimationFrame(raf);
    if (document.hidden || !active) timeline.pause();
    else {
      if (!finished) timeline.resume();
      lastTime = 0; raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", visibility);
  start(); raf = requestAnimationFrame(frame);
  return {
    skip, toggleMenu,
    setActive(value) {
      active = value;
      cancelAnimationFrame(raf);
      if (!active) timeline.pause();
      else if (!document.hidden) {
        resize();
        if (!finished) timeline.resume();
        lastTime = 0; raf = requestAnimationFrame(frame);
      }
    },
    hover(id) { hovered = id; },
    setReduced(value) {
      reduced = value;
      if (value) { skip(); gsap.killTweensOf(expansion); expansion.value = opened ? 1 : 0; }
    },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); timeline.kill(); gsap.killTweensOf(expansion);
      observer.disconnect(); document.removeEventListener("visibilitychange", visibility);
      pointerMedia.removeEventListener("change", resize);
      for (const button of buttons) gsap.killTweensOf(button.flip);
      host.removeEventListener("pointermove", pointerMove); host.removeEventListener("pointerleave", pointerLeave);
      resources.dispose();
      smallHive.dispose();
      rendering.dispose();
    },
  };
}
