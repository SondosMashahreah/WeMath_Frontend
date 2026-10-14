import * as THREE from "three";
import { BEE_THEME, HIVE_ITEMS, DESKTOP_HIVE, medallionOutline } from "../lib/beeConfig.js";
import { HIVE_GRADIENT } from "../lib/hiveColors.js";

// Desktop small hexagons only. This module owns its meshes and palette;
// it never edits the intro, letters, proof pieces, center emblem or lighting.
export function createSmallHive({ world, mesh, prism, tube, material, gold }) {
  let layout = { desktopMenu: false };
  // One continuous color ramp is shared by all cells. Texture coordinates,
  // rather than a single color per material, blend colors across each surface.
  function createHiveGradientTexture() {
    const colors = HIVE_GRADIENT.colors.map(color => new THREE.Color(color));
    // A high-resolution shared ramp, not a separate flat color per cell.
    const size = Math.max(2, (colors.length - 1) * 128 + 1);
    const pixels = new Uint8Array(size * 4);
    const distribution = Math.max(0.1, HIVE_GRADIENT.distribution ?? 1);
    const sample = new THREE.Color();
    for (let i = 0; i < size; i++) {
      const t = (i / (size - 1)) ** distribution * (colors.length - 1);
      const from = Math.floor(t), to = Math.min(from + 1, colors.length - 1);
      sample.lerpColors(colors[from], colors[to], t - from).convertLinearToSRGB();
      pixels[i * 4] = Math.round(sample.r * 255);
      pixels[i * 4 + 1] = Math.round(sample.g * 255);
      pixels[i * 4 + 2] = Math.round(sample.b * 255);
      pixels[i * 4 + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, size, 1, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }
  const hiveGradientTexture = createHiveGradientTexture();
  // Hollow only the ten desktop cell frames. The outer contour, side depth,
  // bevel and decorative rims keep their original measurements and materials.
  // This has an actual opening; there is no stationary face behind the panel.
  function cellFrame() {
    const outline = medallionOutline(1, 1, 6);
    const sections = [
      [1, 0.12], [0.9825, 0.155], [0.915, 0.155], [0.9, 0.12],
      [0.9, -0.12], [0.915, -0.155], [0.9825, -0.155], [1, -0.12],
    ];
    const positions = [];
    for (let j = 0; j < sections.length; j++) {
      const [ra, za] = sections[j], [rb, zb] = sections[(j + 1) % sections.length];
      for (let i = 0; i < outline.length; i++) {
        const a = outline[i], b = outline[(i + 1) % outline.length];
        const A = [a.x * ra, a.y * ra, za], B = [b.x * ra, b.y * ra, za];
        const C = [b.x * rb, b.y * rb, zb], D = [a.x * rb, a.y * rb, zb];
        positions.push(...A, ...B, ...C, ...A, ...C, ...D);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }

  const cells = new THREE.Group();
  world.add(cells);
  const buttons = HIVE_ITEMS.map(item => {
    const group = new THREE.Group();
    group.name = `cell-${item.id}`;
    cells.add(group);
    // The inner colored panel and its icon/name turn together inside a fixed
    // hollow frame, like the reference. All of this is desktop-cell-only.
    const pivot = new THREE.Group();
    pivot.name = `flip-${item.id}`;
    pivot.position.z = 0.065;
    group.add(pivot);
    const tileMat = material(BEE_THEME.cream, { roughness: 0.36 });
    const classicSurface = mesh(prism(medallionOutline(1, 1, 6), 0.24, 0.035), tileMat, group);
    classicSurface.name = `classic-surface-${item.id}`;
    const frame = mesh(cellFrame(), tileMat, group);
    frame.name = `frame-${item.id}`;
    const panelMat = material(BEE_THEME.cream, { roughness: 0.42, metalness: 0.08 });
    const surface = mesh(prism(medallionOutline(1, 0.885, 6), 0.16, 0.01), panelMat, pivot);
    surface.name = `surface-${item.id}`;
    for (const side of [1, -1]) {
      const border = tube(medallionOutline(1, 0.935, 30).map(v => [v.x, v.y, side * 0.165]), 0.009, gold, group, true);
      border.name = `rim-${item.id}-${side}`;
    }
    const front = new THREE.Object3D(), back = new THREE.Object3D();
    front.position.z = 0.096;
    back.position.z = -0.096;
    back.rotation.y = Math.PI;
    front.scale.set(0.885, 0.885, 1);
    back.scale.copy(front.scale);
    pivot.add(front, back);
    return { item, group, pivot, front, back, surface, classicSurface, frame, tileMat, panelMat, progress: 0, flip: { value: 0 }, flipTarget: 0 };
  });

  // Project the reference positions onto a common gradient direction. The UVs
  // are interpolated over every triangle, including its center and bevels.
  // They stay valid when the whole desktop design is scaled to a new viewport.
  function mapHiveGradient() {
    const angle = HIVE_GRADIENT.angle * Math.PI / 180;
    const directionX = Math.cos(angle), directionY = Math.sin(angle);
    const records = buttons.map(({ item, surface }) => {
      const cell = DESKTOP_HIVE.cells[item.id], positions = surface.geometry.getAttribute("position");
      const normals = surface.geometry.getAttribute("normal");
      const coordinates = Array.from({ length: positions.count }, (_, i) => {
        // The back becomes front after a Y-axis half-turn. Mirror its UVs now
        // so the shared gradient still matches its neighbors when showing text.
        const faceX = normals.getZ(i) < -0.5 ? -positions.getX(i) : positions.getX(i);
        const x = cell.x + faceX * cell.width / 2;
        const y = cell.y - positions.getY(i) * cell.height / Math.sqrt(3);
        return x * directionX + y * directionY;
      });
      return { surface, coordinates, min: Math.min(...coordinates), max: Math.max(...coordinates) };
    });
    const hiveMin = Math.min(...records.map(record => record.min));
    const hiveMax = Math.max(...records.map(record => record.max));
    for (const { surface, coordinates, min, max } of records) {
      const from = HIVE_GRADIENT.spread === "cell" ? min : hiveMin;
      const to = HIVE_GRADIENT.spread === "cell" ? max : hiveMax;
      const span = Math.max(to - from, 0.0001);
      const uv = new Float32Array(coordinates.length * 2);
      coordinates.forEach((value, i) => {
        uv[i * 2] = (value - from) / span;
        uv[i * 2 + 1] = 0.5;
      });
      surface.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
  }
  mapHiveGradient();

  function syncHiveGradient() {
    const map = layout.desktopMenu && HIVE_GRADIENT.enabled ? hiveGradientTexture : null;
    for (const { panelMat, classicSurface, frame, pivot } of buttons) {
      classicSurface.visible = !layout.desktopMenu;
      frame.visible = layout.desktopMenu;
      pivot.visible = layout.desktopMenu;
      if (panelMat.map !== map) { panelMat.map = map; panelMat.needsUpdate = true; }
      panelMat.color.set(map ? 0xffffff : BEE_THEME.cream);
    }
  }

  function syncCellContrast(button, element) {
    if (!layout.desktopMenu || !HIVE_GRADIENT.enabled) {
      if (element.dataset.hiveContrast) {
        element.style.removeProperty("--icon");
        element.style.removeProperty("color");
        element.style.removeProperty("--icon-shadow");
        delete element.dataset.hiveContrast;
      }
      return;
    }
    const uv = button.surface.geometry.getAttribute("uv");
    // The first face triangle starts at the cell's center vertex.
    const u = Math.max(0, Math.min(1, uv.getX(0)));
    const data = hiveGradientTexture.image.data;
    const offset = Math.round(u * (hiveGradientTexture.image.width - 1)) * 4;
    const color = new THREE.Color().setRGB(data[offset] / 255, data[offset + 1] / 255, data[offset + 2] / 255, THREE.SRGBColorSpace);
    const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
    const ink = luminance < 0.25 ? HIVE_GRADIENT.contentOnDark : HIVE_GRADIENT.contentOnLight;
    if (element.dataset.hiveContrast !== ink) {
      element.style.setProperty("--icon", ink);
      element.style.setProperty("color", ink);
      element.style.setProperty("--icon-shadow", "transparent");
      element.dataset.hiveContrast = ink;
    }
  }

  return {
    buttons,
    applyLayout(next) { layout = next; syncHiveGradient(); },
    syncContrast: syncCellContrast,
    dispose() { hiveGradientTexture.dispose(); },
  };
}
