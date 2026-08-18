[CmdletBinding()]
param([int]$Port = 4000)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$distIndex = Join-Path $repoRoot 'client\dist\index.html'
$envFile = Join-Path $repoRoot 'server\.env'
$logDir = Join-Path $repoRoot 'logs'

if (-not (Test-Path -LiteralPath $envFile)) { throw 'server\.env is missing. Run install.ps1 first.' }
if (-not (Test-Path -LiteralPath $distIndex)) { throw 'The production build is missing. Run npm run build.' }
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

try { $live = (Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health/live" -TimeoutSec 2).success } catch { $live = $false }
if ($live) {
  try { $ready = (Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health/ready" -TimeoutSec 5).success } catch { $ready = $false }
  if (-not $ready) { throw "The application is running on port $Port, but PostgreSQL is unavailable. Check DATABASE_URL and the PostgreSQL service." }
  Write-Host "Server is already running: http://127.0.0.1:$Port" -ForegroundColor Green
  exit 0
}

if (-not $live) {
  $env:NODE_ENV = 'production'
  $env:PORT = "$Port"
  Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'start', '--prefix', 'server') -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'server.out.log') -RedirectStandardError (Join-Path $logDir 'server.error.log') | Out-Null
}

$deadline = (Get-Date).AddSeconds(60)
do {
  Start-Sleep -Milliseconds 800
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health/ready" -TimeoutSec 2
    if ($health.success) { Write-Host "Server started: http://127.0.0.1:$Port" -ForegroundColor Green; exit 0 }
  } catch { }
} while ((Get-Date) -lt $deadline)

throw 'The server did not start within 60 seconds. Check logs\server.error.log and PostgreSQL.'
