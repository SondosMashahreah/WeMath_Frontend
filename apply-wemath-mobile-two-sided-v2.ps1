param(
  [string]$Root = "."
)

$ErrorActionPreference = "Stop"

function Read-Text([string]$Path) {
  $text = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
  return $text -replace "`r`n", "`n"
}

function Write-Text([string]$Path, [string]$Content) {
  # Keep Windows-friendly CRLF.
  $Content = $Content -replace "(?<!`r)`n", "`r`n"
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Backup-Once([string]$Path) {
  $backup = "$Path.mobile-two-sided.bak"
  if (-not (Test-Path $backup)) {
    Copy-Item $Path $backup
    Write-Host "[BACKUP] $backup"
  }
}

function Replace-RegexRequired(
  [string]$Path,
  [string]$Pattern,
  [string]$Replacement,
  [string]$AlreadyPattern,
  [string]$Label
) {
  $content = Read-Text $Path

  if ($AlreadyPattern -and [regex]::IsMatch($content, $AlreadyPattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)) {
    Write-Host "[OK] $Label already applied"
    return
  }

  $regex = New-Object System.Text.RegularExpressions.Regex(
    $Pattern,
    [System.Text.RegularExpressions.RegexOptions]::Multiline -bor
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  if (-not $regex.IsMatch($content)) {
    throw "Could not find expected code for: $Label`nFile: $Path"
  }

  Backup-Once $Path
  $updated = $regex.Replace($content, $Replacement, 1)
  Write-Text $Path $updated
  Write-Host "[DONE] $Label"
}

function Replace-LiteralRequired(
  [string]$Path,
  [string]$Old,
  [string]$New,
  [string]$Label
) {
  $content = Read-Text $Path

  if ($content.Contains($New)) {
    Write-Host "[OK] $Label already applied"
    return
  }

  if (-not $content.Contains($Old)) {
    throw "Could not find expected code for: $Label`nFile: $Path"
  }

  Backup-Once $Path
  Write-Text $Path ($content.Replace($Old, $New))
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

# ----------------------------------------------------------------------
# 1) HOME CSS: on classic/mobile, show real .bee-cell-front/.bee-cell-back
# ----------------------------------------------------------------------
$classicCss = @'

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
'@

Replace-RegexRequired `
  $beeCss `
  '(\.bee-experience\[data-layout="desktop"\]\s+\.bee-cell-back\s*\{\s*visibility:\s*hidden;\s*\})' `
  ('$1' + $classicCss) `
  '\.bee-experience\[data-layout="classic"\]\s+\.bee-mobile-content\s*\{\s*display:\s*none;\s*\}' `
  "home mobile front/back CSS"

# ----------------------------------------------------------------------
# 2) StudentHive: mobile must NOT merge front + back content.
# ----------------------------------------------------------------------
$cellPattern = 'function\s+CellContent\(\{\s*item,\s*back\s*=\s*false,\s*mobile\s*=\s*false\s*\}\)\s*\{\s*const\s+ResourceIcon\s*=\s*LESSON_RESOURCE_ICONS\[item\.id\];.*?const\s+labelText\s*=\s*faceLines\.join\(" "\)\s*\|\|\s*item\.label\s*\|\|\s*"";'
$cellReplacement = @'
function CellContent({ item, back = false }) {
  const ResourceIcon = LESSON_RESOURCE_ICONS[item.id];
  const faceLines = (back ? item.backLines : item.frontLines) || item.lines || [item.label];

  const labelText = faceLines.join(" ") || item.label || "";
'@

Replace-RegexRequired `
  $studentHive `
  $cellPattern `
  $cellReplacement `
  'function\s+CellContent\(\{\s*item,\s*back\s*=\s*false\s*\}\).*?const\s+faceLines\s*=\s*\(back\s*\?\s*item\.backLines\s*:\s*item\.frontLines\)' `
  "separate mobile front/back content"

# Remove the mobile-only label from resource icon front face.
$resourcePattern = '\{mobile\s*&&\s*\(\s*<span\s+className=\{`student-cell-caption\s+\$\{fitTextClass\(labelText\)\}`\}>\s*\{item\.label\}\s*</span>\s*\)\}\s*'
Replace-RegexRequired `
  $studentHive `
  $resourcePattern `
  '' `
  'student-resource-icon-face">\s*<ResourceIcon' `
  "resource icon keeps icon-only front face"

# Remove mobile React state/effect if still present.
$mobileStatePattern = '(\s*const\s+\[status,\s*setStatus\]\s*=\s*useState\("loading"\);)\s*const\s+\[mobile,\s*setMobile\]\s*=\s*useState\(\(\)\s*=>\s*window\.innerWidth\s*<\s*800\);\s*useEffect\(\(\)\s*=>\s*\{\s*const\s+onResize\s*=\s*\(\)\s*=>\s*setMobile\(window\.innerWidth\s*<\s*800\);.*?\},\s*\[\]\);'
Replace-RegexRequired `
  $studentHive `
  $mobileStatePattern `
  '$1' `
  'const\s+\[status,\s*setStatus\]\s*=\s*useState\("loading"\);\s*useEffect\(\(\)\s*=>\s*\{\s*let\s+cancelled' `
  "remove merged-mobile display state"

Replace-LiteralRequired `
  $studentHive `
  '<CellContent item={item} mobile={mobile} />' `
  '<CellContent item={item} />' `
  "front face uses real front content"

Replace-LiteralRequired `
  $studentHive `
  '<CellContent item={item} back mobile={false} />' `
  '<CellContent item={item} back />' `
  "back face uses real back content"

# ----------------------------------------------------------------------
# 3) Shared hive animation: allow automatic flip on touch/mobile.
#    These changes assume the earlier all-hives-auto-flip patch exists.
# ----------------------------------------------------------------------
$studentAutoOld = @'
    const autoEnabled = pointerMedia.matches
      && !reduced
      && !hovered
      && Number.isFinite(autoFlipStartedAt);
'@
$studentAutoNew = @'
    const autoEnabled = !reduced
      && (!pointerMedia.matches || !hovered)
      && Number.isFinite(autoFlipStartedAt);
'@
Replace-LiteralRequired $studentScene $studentAutoOld $studentAutoNew "shared auto flip on touch/mobile"

$pointerResetOld = @'
    autoFlipStartedAt = !reduced && pointerMedia.matches && hive
      ? performance.now() / 1000 + AUTO_FLIP_DELAY
      : Number.POSITIVE_INFINITY;
'@
$pointerResetNew = @'
    autoFlipStartedAt = !reduced && hive
      ? performance.now() / 1000 + AUTO_FLIP_DELAY
      : Number.POSITIVE_INFINITY;
'@
Replace-LiteralRequired $studentScene $pointerResetOld $pointerResetNew "shared mobile auto-flip reset"

Replace-LiteralRequired `
  $studentScene `
  '} else if (hive && pointerMedia.matches) {' `
  '} else if (hive) {' `
  "shared mobile auto-flip reduced-motion restore"

# ----------------------------------------------------------------------
# 4) HOME scene: mobile/classic gets the same two-sided animation.
# ----------------------------------------------------------------------
$homeAutoOld = '    const autoEnabled = layout.desktopMenu && opened && !reduced && active;'
$homeAutoNew = @'
    const desktopHover = layout.desktopMenu && hovered === button.item.id;
    const autoBlockedByHover = layout.desktopMenu && Boolean(hovered);
    const autoEnabled = opened && !reduced && active;
'@
Replace-LiteralRequired $beeScene $homeAutoOld $homeAutoNew "home auto flip enabled on mobile"

$homeTargetOld = @'
    const target = layout.desktopMenu && opened
      && (hovered === button.item.id || (!hovered && autoTarget))
      ? 1
      : 0;
'@
$homeTargetNew = @'
    const target = opened
      && (desktopHover || (!autoBlockedByHover && autoTarget))
      ? 1
      : 0;
'@
Replace-LiteralRequired $beeScene $homeTargetOld $homeTargetNew "home mobile flip target"

Replace-LiteralRequired `
  $beeScene `
  '    if (!layout.desktopMenu || reduced) {' `
  '    if (reduced) {' `
  "home animated flip stays active on mobile"

Replace-LiteralRequired `
  $beeScene `
  '        if (hit && layout.desktopMenu) {' `
  '        if (hit) {' `
  "home projects both faces on mobile"

Write-Host ""
Write-Host "SUCCESS: mobile two-sided hexagons are applied."
Write-Host "Backups: *.mobile-two-sided.bak"
Write-Host "Run: npm run dev -- --port 5173"
