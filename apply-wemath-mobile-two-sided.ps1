param(
  [string]$Root = "."
)

$ErrorActionPreference = "Stop"

function Read-Utf8([string]$Path) {
  return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Backup-Once([string]$Path) {
  $backup = "$Path.mobile-two-sided.bak"
  if (-not (Test-Path $backup)) {
    Copy-Item $Path $backup
  }
}

function Replace-Required(
  [string]$Path,
  [string]$Old,
  [string]$New,
  [string]$Label
) {
  $content = Read-Utf8 $Path

  if ($content.Contains($New)) {
    Write-Host "[OK] $Label already applied"
    return
  }

  if (-not $content.Contains($Old)) {
    throw "Could not find expected block for: $Label`nFile: $Path"
  }

  Backup-Once $Path
  $content = $content.Replace($Old, $New)
  Write-Utf8NoBom $Path $content
  Write-Host "[DONE] $Label"
}

$rootPath = (Resolve-Path $Root).Path

$beeCss = Join-Path $rootPath "src\styles\bee.css"
$studentHive = Join-Path $rootPath "src\shared\hive\StudentHive.jsx"
$studentScene = Join-Path $rootPath "src\shared\hive\createStudentScene.js"
$beeScene = Join-Path $rootPath "src\scene\beeScene.js"

foreach ($file in @($beeCss, $studentHive, $studentScene, $beeScene)) {
  if (-not (Test-Path $file)) {
    throw "Missing file: $file`nRun this script from the WeMath_Frontend folder."
  }
}

# 1) Home mobile/classic: show real front/back faces instead of combined mobile content.
$oldCss = @'
.bee-experience[data-layout="desktop"] .bee-cell-back { visibility: hidden; }
.bee-experience[data-layout="desktop"] .bee-cell-front .bee-cell-icon {
'@

$newCss = @'
.bee-experience[data-layout="desktop"] .bee-cell-back { visibility: hidden; }

/* Mobile/classic uses the same real front/back faces as desktop. */
.bee-experience[data-layout="classic"] .bee-mobile-content { display: none; }
.bee-experience[data-layout="classic"] .bee-cell-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: 0 0;
  pointer-events: none;
  user-select: none;
  will-change: transform;
}
.bee-experience[data-layout="classic"] .bee-cell-back { visibility: hidden; }

.bee-experience[data-layout="desktop"] .bee-cell-front .bee-cell-icon {
'@

Replace-Required $beeCss $oldCss $newCss "home mobile front/back CSS"

# 2) Student/parent/teacher hives: do not merge both faces on mobile.
$oldCellContent = @'
function CellContent({ item, back = false, mobile = false }) {
  const ResourceIcon = LESSON_RESOURCE_ICONS[item.id];

  let faceLines;

  if (mobile) {
    if (item.kind === "unit" || item.kind === "lesson") {
      const numberLine = (item.frontLines || []).join(" ");
      const titleLines = item.backLines || [];
      faceLines = [numberLine, ...titleLines];
    } else if (ResourceIcon) {
      faceLines = [item.label];
    } else {
      faceLines = item.lines || [item.label];
    }
  } else {
    faceLines = (back ? item.backLines : item.frontLines) || item.lines || [];
  }

  const labelText = faceLines.join(" ") || item.label || "";
'@

$newCellContent = @'
function CellContent({ item, back = false }) {
  const ResourceIcon = LESSON_RESOURCE_ICONS[item.id];
  const faceLines = (back ? item.backLines : item.frontLines) || item.lines || [item.label];

  const labelText = faceLines.join(" ") || item.label || "";
'@

Replace-Required $studentHive $oldCellContent $newCellContent "separate mobile front/back content"

$oldResourceMobileCaption = @'
      <span className={`student-cell-content student-cell-${item.kind} student-resource-icon-face`}>
        {mobile && (
          <span className={`student-cell-caption ${fitTextClass(labelText)}`}>
            {item.label}
          </span>
        )}

        <ResourceIcon
'@

$newResourceMobileCaption = @'
      <span className={`student-cell-content student-cell-${item.kind} student-resource-icon-face`}>
        <ResourceIcon
'@

Replace-Required $studentHive $oldResourceMobileCaption $newResourceMobileCaption "resource icon front face"

$oldMobileState = @'
  const [status, setStatus] = useState("loading");
  const [mobile, setMobile] = useState(() => window.innerWidth < 800);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 800);

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
'@

$newMobileState = @'
  const [status, setStatus] = useState("loading");

  useEffect(() => {
'@

Replace-Required $studentHive $oldMobileState $newMobileState "remove one-face mobile state"

Replace-Required `
  $studentHive `
  '<CellContent item={item} mobile={mobile} />' `
  '<CellContent item={item} />' `
  "front face JSX"

Replace-Required `
  $studentHive `
  '<CellContent item={item} back mobile={false} />' `
  '<CellContent item={item} back />' `
  "back face JSX"

# 3) Shared student/parent/teacher auto flip: allow touch/mobile too.
$oldAutoEnabled = @'
    const autoEnabled = pointerMedia.matches
      && !reduced
      && !hovered
      && Number.isFinite(autoFlipStartedAt);
'@

$newAutoEnabled = @'
    const autoEnabled = !reduced
      && (!pointerMedia.matches || !hovered)
      && Number.isFinite(autoFlipStartedAt);
'@

Replace-Required $studentScene $oldAutoEnabled $newAutoEnabled "auto flip on touch/mobile"

$oldPointerReset = @'
    autoFlipStartedAt = !reduced && pointerMedia.matches && hive
      ? performance.now() / 1000 + AUTO_FLIP_DELAY
      : Number.POSITIVE_INFINITY;
'@

$newPointerReset = @'
    autoFlipStartedAt = !reduced && hive
      ? performance.now() / 1000 + AUTO_FLIP_DELAY
      : Number.POSITIVE_INFINITY;
'@

Replace-Required $studentScene $oldPointerReset $newPointerReset "restart auto flip on mobile"

Replace-Required `
  $studentScene `
  '} else if (hive && pointerMedia.matches) {' `
  '} else if (hive) {' `
  "re-enable auto flip after reduced motion"

# 4) Home scene: allow flip + face projection in classic/mobile layout.
$oldHomeAuto = @'
    const autoEnabled = layout.desktopMenu && opened && !reduced && active;
'@
$newHomeAuto = @'
    const desktopHover = layout.desktopMenu && hovered === button.item.id;
    const autoBlockedByHover = layout.desktopMenu && Boolean(hovered);
    const autoEnabled = opened && !reduced && active;
'@
Replace-Required $beeScene $oldHomeAuto $newHomeAuto "home auto flip on mobile"

$oldHomeTarget = @'
    const target = layout.desktopMenu && opened
      && (hovered === button.item.id || (!hovered && autoTarget))
      ? 1
      : 0;
'@
$newHomeTarget = @'
    const target = opened
      && (desktopHover || (!autoBlockedByHover && autoTarget))
      ? 1
      : 0;
'@
Replace-Required $beeScene $oldHomeTarget $newHomeTarget "home mobile flip target"

Replace-Required `
  $beeScene `
  '    if (!layout.desktopMenu || reduced) {' `
  '    if (reduced) {' `
  "keep animated flip in classic/mobile"

Replace-Required `
  $beeScene `
  '        if (hit && layout.desktopMenu) {' `
  '        if (hit) {' `
  "project both faces on mobile"

Write-Host ""
Write-Host "Mobile two-sided hexagons applied successfully."
Write-Host "Backups were created beside changed files with suffix: .mobile-two-sided.bak"
Write-Host "Next: npm run dev -- --port 5173"
