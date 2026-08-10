$ErrorActionPreference = 'Stop'
$taskName = 'DGD Info Kiosk'
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host 'Autostart task removed.' -ForegroundColor Green
} else { Write-Host 'Autostart task was not found.' -ForegroundColor Yellow }
