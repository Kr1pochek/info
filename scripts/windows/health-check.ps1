[CmdletBinding()]
param(
  [int]$Port = 4000,
  [string]$LogPath
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
if (-not $LogPath) { $LogPath = Join-Path $repoRoot 'logs\health.log' }
$logDirectory = Split-Path $LogPath -Parent
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

function Write-HealthLog([string]$Status, [string]$Message) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Status] $Message"
  Add-Content -LiteralPath $LogPath -Value $line -Encoding utf8
}

try {
  $live = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health/live" -TimeoutSec 5
  if (-not $live.success) { throw 'The application process returned an invalid status.' }
} catch {
  Write-HealthLog 'FAIL' "Application is unavailable on port $Port."
  Write-Error "FAIL: application is not available on port $Port. $($_.Exception.Message)"
  exit 1
}

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health/ready" -TimeoutSec 5
  if (-not $health.success) { throw 'The database readiness check is degraded.' }
  Write-HealthLog 'OK' "Application and PostgreSQL are ready on port $Port."
  Write-Host "OK: application is available and the database is connected on port $Port." -ForegroundColor Green
} catch {
  Write-HealthLog 'FAIL' "Application is running, but PostgreSQL is unavailable on port $Port."
  Write-Error "FAIL: application is running, but PostgreSQL is unavailable. Check DATABASE_URL and the PostgreSQL service. $($_.Exception.Message)"
  exit 1
}
