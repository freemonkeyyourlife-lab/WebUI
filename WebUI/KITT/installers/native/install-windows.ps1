# PowerShell installer for Windows (install-windows.ps1)

param(
  [string]$RootDir = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\..\..\.."
)

# Create Python venv
python -m venv "$RootDir\.venv"
& "$RootDir\.venv\Scripts\Activate.ps1"

pip install --upgrade pip
if (Test-Path "$RootDir\requirements.txt") { pip install -r "$RootDir\requirements.txt" }

# Install node deps
if (Get-Command npm -ErrorAction SilentlyContinue) {
  Push-Location "$RootDir\WebUI\KITT\instruct-repair"
  npm install
  Pop-Location
  Push-Location "$RootDir\WebUI\KITT\installers\electron"
  npm install
  Pop-Location
}

Write-Host "Installation complete. Start services with:`n  & $RootDir\.venv\Scripts\Activate.ps1`n  node WebUI/KITT/instruct-repair/server.js"
