$ErrorActionPreference = 'Stop'
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$accounts = Get-Content (Join-Path $workspaceRoot '.e2e-accounts.json') -Raw | ConvertFrom-Json
$admin = $accounts.accounts | Where-Object key -eq 'admin'
$user = $accounts.accounts | Where-Object key -eq 'user'
$peer = $accounts.accounts | Where-Object key -eq 'peer'

$env:E2E_API_URL = 'http://127.0.0.1:3001'
$env:E2E_DATABASE_NAME = 'hoca-e2e-codex'
$env:E2E_ALLOW_MUTATIONS = 'true'
$env:E2E_ADMIN_EMAIL = $admin.email
$env:E2E_ADMIN_PASSWORD = $accounts.password
$env:E2E_USER_EMAIL = $user.email
$env:E2E_USER_PASSWORD = $accounts.password
$env:E2E_PEER_EMAIL = $peer.email
$env:E2E_PEER_PASSWORD = $accounts.password

npm.cmd run test:e2e:real
exit $LASTEXITCODE
