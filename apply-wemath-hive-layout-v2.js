const fs = require("fs");
const path = require("path");

const configPath = path.join(process.cwd(), "src", "lib", "beeConfig.js");
const backupPath = `${configPath}.layout-backup`;

if (!fs.existsSync(configPath)) {
  throw new Error(
    `Missing file: ${configPath}\nRun this script from WeMath_Frontend.`
  );
}

let text = fs.readFileSync(configPath, "utf8");

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(configPath, backupPath);
  console.log(`[BACKUP] ${backupPath}`);
}

// Mobile: 11 small hexagons arranged around the large center hexagon.
const mobilePositions = {
  research:     { x:  0.00, y:  3.70 },

  assistant:    { x: -1.90, y:  2.65 },
  parents:      { x:  1.90, y:  2.65 },

  workshops:    { x: -3.20, y:  1.10 },
  initiatives:  { x:  3.20, y:  1.10 },

  students:     { x: -3.20, y: -1.05 },
  competitions: { x:  3.20, y: -1.05 },

  teachers:     { x: -2.55, y: -2.85 },
  museum:       { x:  2.55, y: -2.85 },

  alquds:       { x: -1.25, y: -4.15 },
  steam:        { x:  1.25, y: -4.15 },
};

function replaceItemMobile(id, pos) {
  const objectPattern = new RegExp(
    `(\\{\\s*\\n?\\s*id:\\s*"${id}"[\\s\\S]*?mobile:\\s*\\{\\s*x:\\s*)-?\\d+(?:\\.\\d+)?(\\s*,\\s*y:\\s*)-?\\d+(?:\\.\\d+)?(\\s*\\})`,
    "m"
  );

  if (!objectPattern.test(text)) {
    throw new Error(
      `Could not find mobile coordinates for item "${id}" in beeConfig.js`
    );
  }

  text = text.replace(
    objectPattern,
    `$1${pos.x.toFixed(2)}$2${pos.y.toFixed(2)}$3`
  );
}

for (const [id, pos] of Object.entries(mobilePositions)) {
  replaceItemMobile(id, pos);
}

// Laptop: regular 2-3-3-3 honeycomb.
const desktopCells = `  cells: {
    assistant:    { x: 690.0,  y: 264.0, width: 210, height: 182 },
    workshops:    { x: 690.0,  y: 455.9, width: 210, height: 182 },

    students:     { x: 856.2,  y: 168.1, width: 210, height: 182 },
    teachers:     { x: 856.2,  y: 360.0, width: 210, height: 182 },
    parents:      { x: 856.2,  y: 551.9, width: 210, height: 182 },

    initiatives:  { x: 1022.3, y: 264.0, width: 210, height: 182 },
    competitions: { x: 1022.3, y: 455.9, width: 210, height: 182 },
    museum:       { x: 1022.3, y: 647.8, width: 210, height: 182 },

    alquds:       { x: 1188.5, y: 168.1, width: 210, height: 182 },
    research:     { x: 1188.5, y: 360.0, width: 210, height: 182 },
    steam:        { x: 1188.5, y: 551.9, width: 210, height: 182 },
  },`;

const desktopHivePattern =
  /  cells:\s*\{[\s\S]*?\n  \},\n\};\nexport const DESKTOP_FLIP_DURATION/;

if (!desktopHivePattern.test(text)) {
  throw new Error(
    "Could not find DESKTOP_HIVE.cells block in beeConfig.js"
  );
}

text = text.replace(
  desktopHivePattern,
  `${desktopCells}\n};\nexport const DESKTOP_FLIP_DURATION`
);

fs.writeFileSync(configPath, text, "utf8");

console.log("[DONE] Laptop layout: regular 2-3-3-3 honeycomb");
console.log("[DONE] Mobile layout: 11-cell ring around center");
console.log(
  "[DONE] Desktop small cells use one consistent size; animation/content logic is unchanged"
);
console.log("");
console.log("Run: npm run dev -- --port 5173");