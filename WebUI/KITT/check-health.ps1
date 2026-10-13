if (Test-Path (Join-Path $PSScriptRoot ".env")) {
    Get-Content (Join-Path $PSScriptRoot ".env") | ForEach-Object {
        if ($_ -match '^\s*PORT\s*=\s*(.*?)\s*$' -and -not $env:PORT) {
            $env:PORT = $matches[1].Trim('"').Trim("'")
        }
    }
}
$Port = if ($env:PORT) { $env:PORT } else { "3005" }
Invoke-RestMethod "http://127.0.0.1:$Port/api/health"
