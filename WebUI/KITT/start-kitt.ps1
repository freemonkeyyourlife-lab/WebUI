$ErrorActionPreference = "Stop"

$KittDir = $PSScriptRoot
$AppDir = Join-Path $KittDir "instruct-repair"
$ServerScript = Join-Path $AppDir "server.js"
$PidFile = Join-Path $AppDir "kitt-server.pid"
$LogFile = Join-Path $AppDir "kitt-server.log"
$ErrorLogFile = Join-Path $AppDir "kitt-server-error.log"
if (Test-Path (Join-Path $KittDir ".env")) {
    Get-Content (Join-Path $KittDir ".env") | ForEach-Object {
        if ($_ -match '^\s*(HOST|PORT|NODE_ENV)\s*=\s*(.*?)\s*$' -and -not [Environment]::GetEnvironmentVariable($matches[1], "Process")) {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim('"').Trim("'"), "Process")
        }
    }
}
$Port = if ($env:PORT) { $env:PORT } else { "3005" }

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

$Node = Get-Command node -ErrorAction SilentlyContinue
$Npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $Node -or [int]((& node -p "process.versions.node.split('.')[0]")) -lt 18) {
    throw "Node.js 18 or newer is required."
}
if (-not $Npm) {
    throw "npm is required."
}
if (-not (Test-Path (Join-Path $AppDir "node_modules"))) {
    Push-Location $AppDir
    try {
        npm ci --omit=dev
    } finally {
        Pop-Location
    }
}

if (Test-Path $PidFile) {
    $ExistingPid = 0
    if ([int]::TryParse((Get-Content $PidFile -Raw), [ref]$ExistingPid)) {
        $Existing = Get-CimInstance Win32_Process -Filter "ProcessId = $ExistingPid" -ErrorAction SilentlyContinue
        if ($Existing -and $Existing.CommandLine -and $Existing.CommandLine.IndexOf($ServerScript, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            try {
                Invoke-RestMethod "http://127.0.0.1:$Port/api/health" | Out-Null
                Write-Host "K.I.T.T. is already running (PID $ExistingPid)."
                exit 0
            } catch {
                throw "The tracked K.I.T.T. process is running but not healthy (PID $ExistingPid)."
            }
        }
    }
    Remove-Item $PidFile -Force
}

$Process = Start-Process -FilePath $Node.Source -ArgumentList @("`"$ServerScript`"") `
    -WorkingDirectory $AppDir -RedirectStandardOutput $LogFile `
    -RedirectStandardError $ErrorLogFile -PassThru
Set-Content -Path $PidFile -Value $Process.Id

for ($Attempt = 0; $Attempt -lt 30; $Attempt++) {
    try {
        Invoke-RestMethod "http://127.0.0.1:$Port/api/health" | Out-Null
        Write-Host "K.I.T.T. started. Health: http://127.0.0.1:$Port/api/health"
        Write-Host "Logs: $LogFile and $ErrorLogFile"
        exit 0
    } catch {
        if ($Process.HasExited) { break }
        Start-Sleep -Seconds 1
    }
}

if (-not $Process.HasExited) {
    Stop-Process -Id $Process.Id -Force
}
Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
throw "K.I.T.T. failed to become healthy. See $LogFile."
