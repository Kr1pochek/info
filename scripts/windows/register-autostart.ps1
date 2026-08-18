[CmdletBinding()]
param([ValidateSet('news', 'kiosk', 'home')][string]$Page = 'news')

$ErrorActionPreference = 'Stop'
$serverScript = (Resolve-Path (Join-Path $PSScriptRoot 'run-server.ps1')).Path
$kioskScript = (Resolve-Path (Join-Path $PSScriptRoot 'start-kiosk.ps1')).Path
$serverTaskName = 'DGD Info Kiosk Server'
$kioskTaskName = 'DGD Info Kiosk Browser'
$powerShell = (Get-Command powershell.exe).Source
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$serverAction = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$serverScript`""
$serverSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0) -RestartCount 50 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $serverTaskName -Action $serverAction -Trigger $trigger -Settings $serverSettings -Description 'Supervised DGD information kiosk backend' -Force | Out-Null

$kioskAction = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$kioskScript`" -Page $Page -SkipServerStart"
$kioskSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $kioskTaskName -Action $kioskAction -Trigger $trigger -Settings $kioskSettings -Description 'DGD information kiosk browser autostart' -Force | Out-Null
Write-Host "Supervised server and kiosk browser autostart registered for $env:USERNAME. Page: $Page" -ForegroundColor Green
