$ErrorActionPreference = 'Stop'
$envLine = Get-Content (Join-Path $PSScriptRoot '..\.env') | Where-Object { $_ -match '^MONGODB_URI=' } | Select-Object -First 1
if (-not $envLine) { throw 'MONGODB_URI is missing' }
$sourceUri = $envLine.Substring('MONGODB_URI='.Length)
$uriObject = [System.UriBuilder]$sourceUri
$uriObject.Path = '/hoca-e2e-codex'
$e2eUri = $uriObject.Uri.AbsoluteUri
# Some Windows/Node combinations cannot resolve mongodb+srv even though the
# system resolver can. Expand the Atlas SRV record without exposing credentials.
if ($sourceUri.StartsWith('mongodb+srv://')) {
  $parsed = [Uri]($sourceUri -replace '^mongodb\+srv://', 'https://')
  $records = Resolve-DnsName -Type SRV ("_mongodb._tcp." + $parsed.Host) | Where-Object { $_.Type -eq 'SRV' }
  $hosts = ($records | ForEach-Object { "$($_.NameTarget.TrimEnd('.')):$($_.Port)" }) -join ','
  $txt = Resolve-DnsName -Type TXT $parsed.Host | Where-Object { $_.Type -eq 'TXT' } | Select-Object -First 1
  $options = (($txt.Strings -join '') -replace '^\?', '')
  $e2eUri = "mongodb://$($parsed.UserInfo)@$hosts/hoca-e2e-codex?tls=true&$options"
}
if ($e2eUri -notmatch '(e2e|test)') { throw 'Refusing to use a non-E2E database' }

$env:E2E_MONGODB_URI = $e2eUri
$env:E2E_RUN_ID = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
$accountsPath = Join-Path $PSScriptRoot '..\..\.e2e-accounts.json'
node (Join-Path $PSScriptRoot 'seed-e2e.js') | Set-Content -Encoding utf8 $accountsPath
if ($LASTEXITCODE -ne 0) { throw 'Could not seed E2E accounts' }

$env:MONGODB_URI = $e2eUri
$env:PORT = '3001'
$env:NODE_ENV = 'test'
$env:CLIENT_URL = 'http://127.0.0.1:4173'
$backendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$process = Start-Process -FilePath node -ArgumentList 'src/index.js' -WorkingDirectory $backendRoot `
  -RedirectStandardOutput (Join-Path $workspaceRoot '.e2e-backend.out.log') `
  -RedirectStandardError (Join-Path $workspaceRoot '.e2e-backend.err.log') `
  -WindowStyle Hidden -PassThru
$process.Id | Set-Content (Join-Path $workspaceRoot '.e2e-backend.pid')
Write-Output "Started isolated E2E backend PID $($process.Id) on port 3001"
