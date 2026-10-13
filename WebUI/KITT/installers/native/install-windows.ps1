$ErrorActionPreference = "Stop"

$KittDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$AppDir = Join-Path $KittDir "instruct-repair"
$Node = Get-Command node -ErrorAction SilentlyContinue
$Npm = Get-Command npm -ErrorAction SilentlyContinue

if (-not $Node -or [int]((& node -p "process.versions.node.split('.')[0]")) -lt 18) {
    throw "Node.js 18 or newer is required."
}
if (-not $Npm) {
    throw "npm is required."
}

@(
    "mi\users",
    "mi\memory",
    "mi\registry_out",
    "mi\transcripts",
    "voice\samples",
    "voice\jobs",
    "files",
    "instruct-repair\data"
) | ForEach-Object {
    New-Item -ItemType Directory -Path (Join-Path $KittDir $_) -Force | Out-Null
}

Push-Location $AppDir
try {
    npm ci --omit=dev
} finally {
    Pop-Location
}

Write-Host "K.I.T.T. is installed."
Write-Host "Start: & `"$KittDir\start-kitt.ps1`""
Write-Host "Stop: & `"$KittDir\stop-kitt.ps1`""
Write-Host "Health: & `"$KittDir\check-health.ps1`""
