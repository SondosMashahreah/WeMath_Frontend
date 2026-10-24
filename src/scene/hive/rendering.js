import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { BEE_THEME, lerp } from "../../lib/beeConfig.js";

// Shared rendering adapter. Both home and student views use the same lighting,
// tone mapping, materials and closed 3D geometry.
export function createHiveRenderer(canvas) {
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
  return { renderer, scene, camera, dispose() {
    light.shadow.dispose(); environmentTarget.dispose(); renderer.dispose();
  } };
}

export function createHivePrimitives() {
  const disposables = new Set(), materials = new Set();
  const geometry = (g) => { disposables.add(g); return g; };
  const material = (color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.17, ...extra });
    materials.add(m);
    return m;
  };
  const mesh = (g, m, parent, xyz = [0, 0, 0]) => {
    const object = new THREE.Mesh(geometry(g), m);
    object.position.set(...xyz);
    object.castShadow = true;
    object.receiveShadow = true;
    parent?.add(object);
    return object;
  };
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

  return { mesh, material, tube, prism, updatePrism, materials, dispose() {
    for (const geometry of disposables) geometry.dispose();
    for (const material of materials) material.dispose();
    disposables.clear(); materials.clear();
  } };
}
