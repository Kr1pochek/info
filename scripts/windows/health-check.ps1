[CmdletBinding()]
param([int]$Port = 4000)

$ErrorActionPreference = 'Stop'
try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 5
  if (-not $health.success) { throw 'The server returned a degraded status.' }
  Write-Host "OK: application is available and the database is connected on port $Port." -ForegroundColor Green
} catch {
  Write-Error "FAIL: $($_.Exception.Message)"
  exit 1
}
