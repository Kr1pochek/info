[CmdletBinding()]
param(
  [ValidateSet('news', 'kiosk', 'home')][string]$Page = 'news',
  [int]$Port = 4000
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
& (Join-Path $PSScriptRoot 'start-server.ps1') -Port $Port

$route = if ($Page -eq 'home') { '' } else { $Page }
$url = "http://127.0.0.1:$Port/$route"
$browserCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
$browser = $browserCandidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $browser) { throw 'Google Chrome or Microsoft Edge was not found.' }
Start-Process -FilePath $browser -ArgumentList @('--kiosk', '--no-first-run', '--disable-session-crashed-bubble', '--autoplay-policy=no-user-gesture-required', $url) -WorkingDirectory $repoRoot
