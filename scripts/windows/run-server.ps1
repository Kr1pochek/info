[CmdletBinding()]
param(
  [int]$Port = 4000,
  [int]$MaxLogSizeMb = 20,
  [int]$LogCopies = 5
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envFile = Join-Path $repoRoot 'server\.env'
$distIndex = Join-Path $repoRoot 'client\dist\index.html'
$logDir = Join-Path $repoRoot 'logs'

if (-not (Test-Path -LiteralPath $envFile)) { throw 'server\.env is missing. Run install.ps1 first.' }
if (-not (Test-Path -LiteralPath $distIndex)) { throw 'The production build is missing. Run npm run build.' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm.cmd was not found in PATH.' }
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Rotate-Log([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return }
  if ((Get-Item -LiteralPath $Path).Length -lt ($MaxLogSizeMb * 1MB)) { return }
  $oldest = "$Path.$LogCopies"
  if (Test-Path -LiteralPath $oldest) { Remove-Item -LiteralPath $oldest -Force }
  for ($index = $LogCopies - 1; $index -ge 1; $index--) {
    $source = "$Path.$index"
    if (Test-Path -LiteralPath $source) { Move-Item -LiteralPath $source -Destination "$Path.$($index + 1)" -Force }
  }
  Move-Item -LiteralPath $Path -Destination "$Path.1" -Force
}

$outputLog = Join-Path $logDir 'server.out.log'
$errorLog = Join-Path $logDir 'server.error.log'
Rotate-Log $outputLog
Rotate-Log $errorLog

$env:NODE_ENV = 'production'
$env:PORT = "$Port"
Push-Location $repoRoot
try {
  & npm.cmd run start --prefix server 1>> $outputLog 2>> $errorLog
  if ($LASTEXITCODE -ne 0) { throw "Backend stopped with exit code $LASTEXITCODE." }
} finally {
  Pop-Location
}
