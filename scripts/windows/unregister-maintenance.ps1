$ErrorActionPreference = 'Stop'
$taskNames = @('DGD Info Kiosk Health', 'DGD Info Kiosk Backup')
$removed = 0
foreach ($taskName in $taskNames) {
  if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    $removed++
  }
}
if ($removed) { Write-Host "Maintenance tasks removed: $removed." -ForegroundColor Green }
else { Write-Host 'Maintenance tasks were not found.' -ForegroundColor Yellow }
