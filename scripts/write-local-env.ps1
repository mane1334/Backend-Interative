# Detect primary LAN IPv4 and write .env.local with VITE_API_URL and VITE_WS_URL
$addr = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.*' } | Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $addr) {
  $addr = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.*' } | Select-Object -First 1 -ExpandProperty IPAddress)
}
if (-not $addr) {
  Write-Error "Could not detect LAN IPv4 address. Provide IP manually or set VITE_API_URL/VITE_WS_URL."; exit 1
}
$api = "http://$addr:3000"
$ws = "ws://$addr:3000"
$envPath = Join-Path -Path (Resolve-Path ..).Path -ChildPath ".env.local"
@"
VITE_API_URL=$api/api
VITE_WS_URL=$ws
"@ | Out-File -FilePath $envPath -Encoding UTF8 -Force
Write-Host "Wrote $envPath with API=$api and WS=$ws"
