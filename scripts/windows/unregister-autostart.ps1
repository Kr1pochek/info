$ErrorActionPreference = 'Stop'
$taskNames = @('DGD Info Kiosk', 'DGD Info Kiosk Server', 'DGD Info Kiosk Browser')
$removed = 0
foreach ($taskName in $taskNames) {
  if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    $removed++
  }
}
if ($removed) { Write-Host "Autostart tasks removed: $removed." -ForegroundColor Green }
else { Write-Host 'Autostart tasks were not found.' -ForegroundColor Yellow }
