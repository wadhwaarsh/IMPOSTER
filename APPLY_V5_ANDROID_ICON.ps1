# Apply the custom Imposter V5 launcher icon to native Android resources.
# Run from the project root AFTER `npx cap add android`.
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceIcon = Join-Path $projectRoot "www\icon-512.png"
# Vite may clear www during `npm run build`; in that case use the retained app-src copy.
if (!(Test-Path $sourceIcon)) {
  $fallbackIcon = Join-Path $projectRoot "app-src\icon-512.png"
  if (Test-Path $fallbackIcon) {
    New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot "www") | Out-Null
    Copy-Item $fallbackIcon $sourceIcon -Force
    Write-Host "Restored launcher icon from app-src to www." -ForegroundColor Cyan
  } else {
    throw "Icon not found in www or app-src. Expected: $sourceIcon"
  }
}
$resRoot = Join-Path $projectRoot "android\app\src\main\res"
if (!(Test-Path $resRoot)) {
  Write-Host "Android project is not present yet. Run 'npx cap add android' first, then rerun this script." -ForegroundColor Yellow
  exit 1
}

Add-Type -AssemblyName System.Drawing
$sizes = @{
  "mipmap-mdpi" = 48
  "mipmap-hdpi" = 72
  "mipmap-xhdpi" = 96
  "mipmap-xxhdpi" = 144
  "mipmap-xxxhdpi" = 192
}
$src = [System.Drawing.Image]::FromFile($sourceIcon)
try {
  foreach ($entry in $sizes.GetEnumerator()) {
    $folder = Join-Path $resRoot $entry.Key
    if (!(Test-Path $folder)) { New-Item -ItemType Directory -Path $folder | Out-Null }
    $size = [int]$entry.Value
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    try {
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($src, 0, 0, $size, $size)
      } finally { $g.Dispose() }
      foreach ($name in @("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")) {
        $dest = Join-Path $folder $name
        $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
      }
    } finally { $bmp.Dispose() }
  }
} finally { $src.Dispose() }

# Ensure adaptive icon background uses the same deep purple as the new artwork.
$valuesDir = Join-Path $resRoot "values"
if (!(Test-Path $valuesDir)) { New-Item -ItemType Directory -Path $valuesDir | Out-Null }
$colorsPath = Join-Path $valuesDir "colors.xml"
$colorsXml = @'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#260D3F</color>
</resources>
'@
Set-Content -Path $colorsPath -Value $colorsXml -Encoding UTF8
Write-Host "Custom Imposter V5 launcher icons written to Android mipmap resources." -ForegroundColor Green
Write-Host "Next: run npx cap sync android, then .\gradlew.bat assembleDebug from the android folder."
