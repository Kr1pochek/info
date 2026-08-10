[CmdletBinding()]
param([switch]$SkipSeed)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envFile = Join-Path $repoRoot 'server\.env'
$envExample = Join-Path $repoRoot 'server\.env.example'

Write-Host "DGD Info Kiosk: installing in $repoRoot" -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20+ was not found. Install the current Node.js LTS.' }
$nodeMajor = [int]((node --version).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 20) { throw "Node.js 20+ is required. Found: $(node --version)" }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm was not found in PATH.' }

if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath $envExample -Destination $envFile
  Write-Host 'Created server\.env. Configure DATABASE_URL and new JWT secrets, then run this script again.' -ForegroundColor Yellow
  exit 2
}

Push-Location $repoRoot
try {
  npm ci
  npm ci --prefix client
  npm ci --prefix server
  npm run db:deploy
  if (-not $SkipSeed) { npm run db:seed }
  npm run build
} finally { Pop-Location }

Write-Host 'Installation complete. Run: .\scripts\windows\start-kiosk.ps1 -Page news' -ForegroundColor Green
