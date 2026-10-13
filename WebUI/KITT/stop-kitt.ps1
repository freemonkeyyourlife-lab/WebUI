$ErrorActionPreference = "Stop"

$AppDir = Join-Path $PSScriptRoot "instruct-repair"
$PidFile = Join-Path $AppDir "kitt-server.pid"
$ServerScript = Join-Path $AppDir "server.js"
if (-not (Test-Path $PidFile)) {
    Write-Host "No K.I.T.T. PID file found."
    exit 0
}

$ServerPid = 0
if (-not [int]::TryParse((Get-Content $PidFile -Raw), [ref]$ServerPid)) {
    Remove-Item $PidFile -Force
    Write-Host "Removed invalid K.I.T.T. PID file."
    exit 0
}

$Process = Get-CimInstance Win32_Process -Filter "ProcessId = $ServerPid" -ErrorAction SilentlyContinue
if (-not $Process -or -not $Process.CommandLine -or $Process.CommandLine.IndexOf($ServerScript, [StringComparison]::OrdinalIgnoreCase) -lt 0) {
    Remove-Item $PidFile -Force
    Write-Host "Tracked process is not K.I.T.T.; left it untouched."
    exit 0
}

Stop-Process -Id $ServerPid
for ($Attempt = 0; $Attempt -lt 10; $Attempt++) {
    if (-not (Get-Process -Id $ServerPid -ErrorAction SilentlyContinue)) {
        Remove-Item $PidFile -Force
        Write-Host "K.I.T.T. stopped."
        exit 0
    }
    Start-Sleep -Seconds 1
}

$Process = Get-CimInstance Win32_Process -Filter "ProcessId = $ServerPid" -ErrorAction SilentlyContinue
if ($Process -and $Process.CommandLine -and $Process.CommandLine.IndexOf($ServerScript, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
    Stop-Process -Id $ServerPid -Force
}
Remove-Item $PidFile -Force
Write-Host "K.I.T.T. stopped."
