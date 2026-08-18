[CmdletBinding()]
param(
  [int]$Port = 4000,
  [string]$BackupRoot,
  [int]$RetentionDays = 14,
  [string]$BackupTime = '02:00'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
if (-not $BackupRoot) { $BackupRoot = Join-Path $repoRoot 'backups' }
$BackupRoot = [System.IO.Path]::GetFullPath($BackupRoot)
$healthScript = (Resolve-Path (Join-Path $PSScriptRoot 'health-check.ps1')).Path
$backupScript = (Resolve-Path (Join-Path $PSScriptRoot 'backup.ps1')).Path
$powerShell = (Get-Command powershell.exe).Source

$healthAction = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$healthScript`" -Port $Port"
$healthTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)
$healthSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'DGD Info Kiosk Health' -Action $healthAction -Trigger $healthTrigger -Settings $healthSettings -Description 'DGD kiosk readiness check every five minutes' -Force | Out-Null

$parsedBackupTime = [DateTime]::ParseExact($BackupTime, 'HH:mm', [Globalization.CultureInfo]::InvariantCulture)
$backupAction = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$backupScript`" -BackupRoot `"$BackupRoot`" -RetentionDays $RetentionDays"
$backupTrigger = New-ScheduledTaskTrigger -Daily -At $parsedBackupTime
$backupSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 2) -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'DGD Info Kiosk Backup' -Action $backupAction -Trigger $backupTrigger -Settings $backupSettings -Description 'Daily DGD kiosk database and uploads backup' -Force | Out-Null

Write-Host "Maintenance registered: health every 5 minutes; backup daily at $BackupTime to $BackupRoot." -ForegroundColor Green
