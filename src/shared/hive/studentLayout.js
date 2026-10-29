import { DESKTOP_HIVE } from "../../lib/beeConfig.js";

// Reuse the home page's design scale; changing stages never changes cell size.
// Design pixels only. The renderer maps these onto the existing 3D camera.
export function studentLayout(width, viewportHeight, items) {
  const mobile = width < 800;
  const cells = {};
  if (mobile) {
    const capacity = width < 360 ? 2 : 3;
    const columns = Math.max(1, Math.min(capacity, items.length));
    const cellWidth = Math.min(148, (width - 34) / (1 + (capacity - 1) * .8));
    const cellHeight = cellWidth * Math.sqrt(3) / 2;
    const stepY = cellHeight + 12, rows = Math.ceil(items.length / columns);
    const centerWidth = Math.min(250, width * .62);
    const gridTop = centerWidth * Math.sqrt(3) / 2 + 65;
    const height = Math.max(viewportHeight, gridTop + (rows - 1) * stepY + stepY / 2 + cellHeight + 45);
    if (items.length === 7) {
      const cx = width / 2;
      const gapX = cellWidth * 0.82;
      const gapY = stepY;

      const topY = gridTop + cellHeight * 0.55;
      const midY = topY + gapY;
      const bottomY = topY + gapY * 2;

      const layout232 = [
        // left column: 2
        { x: cx - gapX, y: topY + gapY * 0.5 },
        { x: cx - gapX, y: bottomY - gapY * 0.5 },

        // middle column: 3
        { x: cx, y: topY },
        { x: cx, y: midY },
        { x: cx, y: bottomY },

        // right column: 2
        { x: cx + gapX, y: topY + gapY * 0.5 },
        { x: cx + gapX, y: bottomY - gapY * 0.5 },
      ];

      items.forEach((item, i) => {
        const pos = layout232[i];
        cells[item.id] = {
          x: pos.x,
          y: pos.y,
          width: cellWidth,
          height: cellHeight,
        };
      });
    } else {
      items.forEach((item, i) => {
        const column = i % columns, row = Math.floor(i / columns);
        cells[item.id] = {
          x: width / 2 + ((columns - 1) / 2 - column) * cellWidth * .8,
          y: gridTop + cellHeight / 2 + row * stepY + (column % 2) * stepY / 2,
          width: cellWidth,
          height: cellHeight
        };
      });
    }
    return { width, height, mobile, center: { x: width / 2, y: centerWidth * Math.sqrt(3) / 4 + 20, width: centerWidth, height: centerWidth * Math.sqrt(3) / 2 }, cells };
  }
  const reference = DESKTOP_HIVE;
  const height = viewportHeight, fit = Math.min(width / reference.width, height / reference.height);
  const ox = (width - reference.width * fit) / 2, oy = (height - reference.height * fit) / 2;
  const point = (x, y, w, h) => ({ x: ox + x * fit, y: oy + y * fit, width: w * fit, height: h * fit });
  const columns = items.length <= 4 ? 2 : items.length <= 6 ? 3 : 4;
  const { width: cellWidth, height: cellHeight } = reference.cells.students;
  // Three staggered rows fit inside the same 740px reference without shrinking.
  const stepY = cellHeight + 4, stepX = 180;
  const referenceCells = Object.values(reference.cells);
  const gridLeft = Math.min(...referenceCells.map(cell => cell.x - cell.width / 2));
  const gridRight = Math.max(...referenceCells.map(cell => cell.x + cell.width / 2));
  const offsets = items.map((_, i) => Math.floor(i / columns) * stepY + (i % columns % 2) * stepY / 2);
  const midpointY = offsets.length ? (Math.min(...offsets) + Math.max(...offsets)) / 2 : 0;
  items.forEach((item, i) => {
    const column = i % columns;
    const x = (gridLeft + gridRight) / 2 + ((columns - 1) / 2 - column) * stepX;
    const y = reference.height / 2 + offsets[i] - midpointY;
    cells[item.id] = point(x, y, cellWidth, cellHeight);
  });
  const { x, y, width: centerWidth, height: centerHeight } = reference.center;
  return { width, height, mobile, center: point(x, y, centerWidth, centerHeight), cells };
}
