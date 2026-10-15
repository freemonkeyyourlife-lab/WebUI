# K.I.T.T. Ein-Befehl-Installer (Windows): .\install.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:KITT_HOME = $PSScriptRoot
$py = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { Write-Error 'Python 3.8+ fehlt.'; exit 1 }

$bundle = Get-ChildItem -Filter 'kitt-bundle*.zip' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($bundle) {
  # Nie überschreiben: nur fehlende Dateien entpacken
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [IO.Compression.ZipFile]::OpenRead($bundle.FullName)
  foreach ($e in $zip.Entries) {
    $t = Join-Path $PSScriptRoot $e.FullName
    if ($e.FullName.EndsWith('/')) { New-Item -ItemType Directory -Force $t | Out-Null }
    elseif (-not (Test-Path $t)) {
      New-Item -ItemType Directory -Force (Split-Path $t) | Out-Null
      [IO.Compression.ZipFileExtensions]::ExtractToFile($e, $t)
    }
  }
  $zip.Dispose()
} else { Write-Host 'Kein Bundle-Zip gefunden - nutze vorhandene Dateien (installer\build_zip.py).' }

& $py.Source core\bootstrap.py --install --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($env:KITT_NO_START -eq '1') { exit 0 }
if (Test-Path .\start-kitt.ps1) { & .\start-kitt.ps1 }
else {
  New-Item -ItemType Directory -Force data | Out-Null
  Start-Process node -ArgumentList 'app\server.js' -WindowStyle Hidden -RedirectStandardOutput data\kitt.log
  Write-Host 'K.I.T.T. gestartet: http://127.0.0.1:3005'
}
