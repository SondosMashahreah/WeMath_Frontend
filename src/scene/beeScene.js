import * as THREE from "three";
import gsap from "gsap";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import fontData from "three/examples/fonts/helvetiker_bold.typeface.json";
import { proofPoints } from "../lib/geometry.js";
import { BEE_THEME, INTRO_DURATION, STORY_DURATION, DISC_RADIUS, SECTOR_COUNT, SECTOR_COLORS, DESKTOP_FLIP_DURATION, between, lerp, medallionOutline, introProofProgress, stageAt, cameraBounds, hiveLayout, ENTRANCE_DELAY } from "../lib/beeConfig.js";

import { createSmallHive } from "./smallHive.js";

const font = new FontLoader().parse(fontData);

/** The automatic 3D introduction and ten display-only honeycomb cells. */
export function createBeeScene({ canvas, host, hitTargets, onStage, onFinish, onMenu, reduced = false }) {
  let disposed = false, raf = 0, width = 1, height = 1, lastTime = 0;
  let opened = false, finished = false, hovered = null;
  const pointerMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
  let lastStage = "", layout = hiveLayout(1366, 900);
  const clock = { seconds: 0 }, expansion = { value: 0 };
  const pointer = new THREE.Vector2(), viewPointer = new THREE.Vector2();
  const disposables = new Set(), materials = new Set();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 1.8));
  renderer.setClearColor(BEE_THEME.background);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 80);
  camera.position.set(0, 0, 24);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, 0.04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.45;
  environment.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xfff8e8, 0x8c705b, 2.3));
  const light = new THREE.DirectionalLight(0xfff6e5, 3.4);
  light.position.set(-5, 7, 10);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -10, right: 10, top: 8, bottom: -8 });
  light.shadow.normalBias = 0.035;
  light.shadow.bias = -0.0001;
  scene.add(light);
  const fill = new THREE.DirectionalLight(0xffffff, 1.4);
  fill.position.set(6, 0, 8);
  scene.add(fill);
  const geometry = (g) => { disposables.add(g); return g; };
  const material = (color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.17, ...extra });
    materials.add(m);
    return m;
  };
  const honey = material(BEE_THEME.honey), cream = material(BEE_THEME.cream);

  const gold = material(BEE_THEME.honeyLight, { metalness: 0.55, roughness: 0.24 });
  const mesh = (g, m, parent, xyz = [0, 0, 0]) => {
    const object = new THREE.Mesh(geometry(g), m);
    object.position.set(...xyz);
    object.castShadow = true;
    object.receiveShadow = true;
    parent?.add(object);
    return object;
  };
  function text(value, size, parent, m = cream, depth = 0.025) {
    const g = new TextGeometry(value, { font, size, depth, curveSegments: 5, bevelEnabled: true, bevelThickness: Math.min(0.008, size * 0.025), bevelSize: Math.min(0.006, size * 0.02), bevelSegments: 2 });
    g.computeBoundingBox();
    const box = g.boundingBox;
    g.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);
    return mesh(g, m, parent);
  }
  function tube(points, radius, m, parent, closed = false) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed, "centripetal");
    return mesh(new THREE.TubeGeometry(path, Math.max(12, points.length * 4), radius, 6, closed), m, parent);
  }
  // Closed convex prism, including front, back, side wall and bevels.
  // Its vertex layout is constant, so a circle can really deform into a hexagon.
  function prism(outline, depth = 0.32, bevel = 0.025) {
    const g = geometry(new THREE.BufferGeometry());
    const positions = new Float32Array(outline.length * 8 * 9);
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    updatePrism(g, outline, depth, bevel);
    return g;
  }
  function updatePrism(g, outline, depth = 0.32, bevel = 0.025) {
    const p = g.attributes.position.array;
    let cursor = 0;
    const cx = outline.reduce((s, v) => s + v.x, 0) / outline.length;
    const cy = outline.reduce((s, v) => s + v.y, 0) / outline.length;
    const inset = (v, z) => [lerp(v.x, cx, bevel / 2), lerp(v.y, cy, bevel / 2), z];
    const tri = (a, b, c) => { for (const v of [a, b, c]) for (const n of v) p[cursor++] = n; };
    const z = depth / 2, top = z + bevel;
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i], b = outline[(i + 1) % outline.length];
      const at = [a.x, a.y, z], bt = [b.x, b.y, z], ab = [a.x, a.y, -z], bb = [b.x, b.y, -z];
      const ai = inset(a, top), bi = inset(b, top), ail = inset(a, -top), bil = inset(b, -top);
      tri([cx, cy, top], ai, bi);
      tri([cx, cy, -top], bil, ail);
      tri(at, ab, bb); tri(at, bb, bt);
      tri(at, bt, bi); tri(at, bi, ai);
      tri(ab, ail, bil); tri(ab, bil, bb);
    }
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
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
    const p = introProofProgress(t);
    const strength = between(t, 5.05, 5.75);
    const union = between(t, 12.1, 12.9);
    sectorMats.forEach(m => { m.opacity = strength; });
    sectorMats[0].color.set(SECTOR_COLORS[0]).lerp(new THREE.Color(BEE_THEME.honey), union);
    sectorMats[1].color.set(SECTOR_COLORS[1]).lerp(new THREE.Color(BEE_THEME.honey), union);
    sectors.forEach((object, i) => {
      const outline = proofPoints(i, p).map(v => ({ x: v.x / 172 * DISC_RADIUS, y: -v.y / 172 * DISC_RADIUS }));
      // y inversion reverses winding.
      outline.reverse();
      updatePrism(object.geometry, outline, 0.24, 0.008 * (1 - union));
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

  // HTML keeps Arabic shaping and React Icons editable. Project it onto the
  // actual face plane, including its rotation and scale, rather than guessing.
  const projection = new THREE.Vector3();
  function projectPoint(object, x, y, z) {
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
    const rect = host.getBoundingClientRect(); width = rect.width; height = rect.height;
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
    if (disposed) return;
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
    if (!document.hidden) raf = requestAnimationFrame(frame);
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
    if (document.hidden) timeline.pause();
    else {
      if (!finished) timeline.resume();
      lastTime = 0; raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", visibility);
  start(); raf = requestAnimationFrame(frame);
  return {
    skip, toggleMenu,
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
      for (const g of disposables) g.dispose(); for (const m of materials) m.dispose();
      smallHive.dispose();
      light.shadow.dispose(); environmentTarget.dispose(); renderer.dispose();
    },
  };
}
