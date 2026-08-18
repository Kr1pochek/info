[CmdletBinding()]
param(
  [string]$BackupRoot,
  [int]$RetentionDays = 14
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
if (-not $BackupRoot) { $BackupRoot = Join-Path $repoRoot 'backups' }
$BackupRoot = [System.IO.Path]::GetFullPath($BackupRoot)
if ([string]::IsNullOrWhiteSpace($BackupRoot) -or $BackupRoot -eq [System.IO.Path]::GetPathRoot($BackupRoot)) { throw 'Invalid backup directory.' }
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

$envFile = Join-Path $repoRoot 'server\.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw 'server\.env was not found.' }
$databaseLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
if (-not $databaseLine) { throw 'DATABASE_URL is missing from server\.env.' }
$databaseUrl = $databaseLine.Substring('DATABASE_URL='.Length).Trim().Trim('"')
$databaseUri = [Uri]$databaseUrl
$databaseCredentials = $databaseUri.UserInfo -split ':', 2
if ($databaseCredentials.Count -ne 2) { throw 'DATABASE_URL must contain a username and password.' }
$databaseUser = [Uri]::UnescapeDataString($databaseCredentials[0])
$databasePassword = [Uri]::UnescapeDataString($databaseCredentials[1])
$databaseName = $databaseUri.AbsolutePath.TrimStart('/')
$databasePort = if ($databaseUri.IsDefaultPort) { 5432 } else { $databaseUri.Port }
$pgDump = Get-Command pg_dump.exe -ErrorAction SilentlyContinue
if (-not $pgDump) { throw 'pg_dump.exe was not found in PATH. Add the PostgreSQL bin directory to PATH.' }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$databaseFile = Join-Path $BackupRoot "database-$stamp.dump"
$uploadsPath = Join-Path $repoRoot 'server\uploads'
$uploadsFile = Join-Path $BackupRoot "uploads-$stamp.zip"

$previousPgPassword = $env:PGPASSWORD
try {
  $env:PGPASSWORD = $databasePassword
  & $pgDump.Source --host=$($databaseUri.Host) --port=$databasePort --username=$databaseUser --dbname=$databaseName --format=custom --file=$databaseFile
  if ($LASTEXITCODE -ne 0) {
    if (Test-Path -LiteralPath $databaseFile) { Remove-Item -LiteralPath $databaseFile -Force }
    throw "pg_dump failed with exit code $LASTEXITCODE"
  }
} finally {
  $env:PGPASSWORD = $previousPgPassword
}
if (Test-Path -LiteralPath $uploadsPath) { Compress-Archive -LiteralPath $uploadsPath -DestinationPath $uploadsFile -CompressionLevel Optimal }

$cutoff = (Get-Date).AddDays(-[Math]::Abs($RetentionDays))
Get-ChildItem -LiteralPath $BackupRoot -File | Where-Object { $_.LastWriteTime -lt $cutoff -and $_.Name -match '^(database|uploads)-' } | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }
Write-Host "Backup created: $databaseFile" -ForegroundColor Green
