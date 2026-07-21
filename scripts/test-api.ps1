# SwipeWise Admin API smoke test (curl)
# Usage: .\scripts\test-api.ps1
# Requires: vercel dev running (default http://localhost:3000 or 3001)

$Base = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:3000" }
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Base URL: $Base`n"

# 1. Login
Write-Host "=== POST /api/auth/login ==="
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/auth/login" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-login.json" `
  -o "$Dir/curl-login-response.json"
Get-Content "$Dir/curl-login-response.json"
Write-Host ""

$token = (Get-Content "$Dir/curl-login-response.json" | ConvertFrom-Json).token
if (-not $token) { Write-Error "Login failed - no token"; exit 1 }

# 2. Me
Write-Host "=== GET /api/auth/me ==="
curl.exe -s -w "`nHTTP %{http_code}`n" "$Base/api/auth/me" `
  -H "Authorization: Bearer $token"
Write-Host ""

# 3. List content
Write-Host "=== GET /api/content ==="
curl.exe -s -w "`nHTTP %{http_code}`n" "$Base/api/content" `
  -H "Authorization: Bearer $token"
Write-Host ""

# 4. Import card
Write-Host "=== POST /api/content ==="
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/content" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-import.json" `
  -o "$Dir/curl-import-response.json"
Get-Content "$Dir/curl-import-response.json"
Write-Host ""

$id = (Get-Content "$Dir/curl-import-response.json" | ConvertFrom-Json).ids[0]

# 5. Publish batch (PATCH /api/content/:id may return SPA HTML in vercel dev)
Write-Host "=== POST /api/content/publish-batch ==="
@{"ids"=@($id)} | ConvertTo-Json -Compress | Set-Content "$Dir/curl-publish.json" -NoNewline
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/content/publish-batch" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-publish.json"
Write-Host ""

# 6. Lineage
Write-Host "=== POST /api/generation/lineage ==="
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/generation/lineage" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-lineage.json"
Write-Host ""

# 7. Bad login
Write-Host "=== POST /api/auth/login (bad password, expect 401) ==="
@{"email"="admin@swipewise.com";"password"="wrong"} | ConvertTo-Json -Compress | Set-Content "$Dir/curl-bad-login.json" -NoNewline
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/auth/login" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-bad-login.json"
Write-Host ""

# 8. Scripts list + import + publish
Write-Host "=== GET /api/scripts ==="
curl.exe -s -w "`nHTTP %{http_code}`n" "$Base/api/scripts" `
  -H "Authorization: Bearer $token"
Write-Host ""

Write-Host "=== POST /api/scripts ==="
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/scripts" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-import-script.json" `
  -o "$Dir/curl-import-script-response.json"
Get-Content "$Dir/curl-import-script-response.json"
Write-Host ""

$scriptId = (Get-Content "$Dir/curl-import-script-response.json" | ConvertFrom-Json).ids[0]
if ($scriptId) {
  Write-Host "=== POST /api/scripts/publish-batch ==="
  @{"ids"=@($scriptId)} | ConvertTo-Json -Compress | Set-Content "$Dir/curl-publish-script.json" -NoNewline
  curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/scripts/publish-batch" `
    -H "Authorization: Bearer $token" `
    -H "Content-Type: application/json" `
    -d "@$Dir/curl-publish-script.json"
  Write-Host ""
}

# 9. QOTD list + import + publish
Write-Host "=== GET /api/qotd ==="
curl.exe -s -w "`nHTTP %{http_code}`n" "$Base/api/qotd" `
  -H "Authorization: Bearer $token"
Write-Host ""

Write-Host "=== POST /api/qotd ==="
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/qotd" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-import-qotd.json" `
  -o "$Dir/curl-import-qotd-response.json"
Get-Content "$Dir/curl-import-qotd-response.json"
Write-Host ""

$qotdId = (Get-Content "$Dir/curl-import-qotd-response.json" | ConvertFrom-Json).ids[0]
if ($qotdId) {
  Write-Host "=== POST /api/qotd/publish-batch ==="
  @{"ids"=@($qotdId)} | ConvertTo-Json -Compress | Set-Content "$Dir/curl-publish-qotd.json" -NoNewline
  curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/qotd/publish-batch" `
    -H "Authorization: Bearer $token" `
    -H "Content-Type: application/json" `
    -d "@$Dir/curl-publish-qotd.json"
  Write-Host ""
}

# 10. Config seed + go-live
Write-Host "=== POST /api/config (seed prototype) ==="
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/config" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-seed-config.json"
Write-Host ""

Write-Host "=== GET /api/config ==="
curl.exe -s -w "`nHTTP %{http_code}`n" "$Base/api/config" `
  -H "Authorization: Bearer $token"
Write-Host ""

Write-Host "=== POST /api/config/set-active (IN live) ==="
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/config/set-active" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-set-active.json"
Write-Host ""

# 11. Jurisdiction data + registry
Write-Host "=== POST /api/jurisdiction-data ==="
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/jurisdiction-data" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-import-jurisdiction-data.json"
Write-Host ""

Write-Host "=== POST /api/jurisdiction-registry ==="
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST "$Base/api/jurisdiction-registry" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@$Dir/curl-import-registry.json"
Write-Host ""

# 12. i18n coverage
Write-Host "=== GET /api/i18n/import (coverage) ==="
curl.exe -s -w "`nHTTP %{http_code}`n" "$Base/api/i18n/import?jurisdiction=IN" `
  -H "Authorization: Bearer $token"
Write-Host ""

Write-Host "Done."
