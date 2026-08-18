[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
  [Parameter(Mandatory = $true)][string]$DatabaseBackup,
  [string]$UploadsBackup,
  [string]$SafetyBackupRoot,
  [switch]$SkipSafetyBackup
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$databaseBackupPath = (Resolve-Path -LiteralPath $DatabaseBackup).Path
if ([System.IO.Path]::GetExtension($databaseBackupPath) -ne '.dump') { throw 'Database backup must be a .dump file created by backup.ps1.' }
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
$pgRestore = Get-Command pg_restore.exe -ErrorAction SilentlyContinue
if (-not $pgRestore) { throw 'pg_restore.exe was not found in PATH. Add the PostgreSQL bin directory to PATH.' }

if (-not $SkipSafetyBackup) {
  if (-not $SafetyBackupRoot) { $SafetyBackupRoot = Join-Path $repoRoot 'backups\before-restore' }
  & (Join-Path $PSScriptRoot 'backup.ps1') -BackupRoot $SafetyBackupRoot -RetentionDays 30
}

if ($PSCmdlet.ShouldProcess("$($databaseUri.Host):$databasePort/$databaseName", "Restore database from $databaseBackupPath")) {
  $previousPgPassword = $env:PGPASSWORD
  try {
    $env:PGPASSWORD = $databasePassword
    & $pgRestore.Source --host=$($databaseUri.Host) --port=$databasePort --username=$databaseUser --dbname=$databaseName --clean --if-exists --no-owner --exit-on-error $databaseBackupPath
    if ($LASTEXITCODE -ne 0) { throw "pg_restore failed with exit code $LASTEXITCODE" }
  } finally {
    $env:PGPASSWORD = $previousPgPassword
  }
}

if ($UploadsBackup) {
  $uploadsBackupPath = (Resolve-Path -LiteralPath $UploadsBackup).Path
  if ([System.IO.Path]::GetExtension($uploadsBackupPath) -ne '.zip') { throw 'Uploads backup must be a .zip file created by backup.ps1.' }
  $uploadsPath = Join-Path $repoRoot 'server\uploads'
  if ($PSCmdlet.ShouldProcess($uploadsPath, "Merge uploaded files from $uploadsBackupPath")) {
    New-Item -ItemType Directory -Path $uploadsPath -Force | Out-Null
    Expand-Archive -LiteralPath $uploadsBackupPath -DestinationPath (Split-Path $uploadsPath -Parent) -Force
  }
}

Write-Host 'Restore completed. Run health-check.ps1 and the acceptance checks.' -ForegroundColor Green
