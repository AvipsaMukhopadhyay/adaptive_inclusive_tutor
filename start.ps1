# One-click start for Windows: Docker Desktop -> PostgreSQL container -> app container -> browser.
# Run with start.bat (double-click). Accounts and progress are kept between runs.
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$url = 'http://localhost:8080'

function Docker-Ready { docker info *> $null; return $LASTEXITCODE -eq 0 }

# 1. Docker Desktop
if (-not (Docker-Ready)) {
    Write-Host 'Starting Docker Desktop...'
    $exe = @("$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe",
             "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $exe) { Write-Host 'Docker Desktop is not installed.' -ForegroundColor Red; exit 1 }
    Start-Process $exe
    for ($i = 0; $i -lt 60 -and -not (Docker-Ready); $i++) { Start-Sleep 3 }
    if (-not (Docker-Ready)) { Write-Host 'Docker did not start. Open Docker Desktop and try again.' -ForegroundColor Red; exit 1 }
}

# 2. Database
docker network inspect tutor *> $null
if ($LASTEXITCODE -ne 0) { docker network create tutor | Out-Null }
docker container inspect tutor-db *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Creating database...'
    docker run -d --name tutor-db --network tutor -e POSTGRES_PASSWORD=tutor -e POSTGRES_DB=adaptive_tutor postgres:16 | Out-Null
} else {
    docker start tutor-db | Out-Null
}

# 3. App (pass -Rebuild after changing code)
if ($args -contains '-Rebuild') {
    Write-Host 'Rebuilding the app image (a few minutes)...'
    docker build -t inclusive-tutor .
    docker rm -f tutor-app *> $null
}
docker image inspect inclusive-tutor *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Building the app image (first time, a few minutes)...'
    docker build -t inclusive-tutor .
}
docker container inspect tutor-app *> $null
if ($LASTEXITCODE -ne 0) {
    docker run -d --name tutor-app --network tutor -p 8080:8080 -e DB_HOST=tutor-db `
        -e DB_USERNAME=postgres -e DB_PASSWORD=tutor inclusive-tutor | Out-Null
} else {
    docker start tutor-app | Out-Null
}

# 4. Wait for the API, then open the browser
Write-Host 'Waiting for the app to start...'
$ok = $false
for ($i = 0; $i -lt 60; $i++) {
    try { Invoke-WebRequest "$url/api/grades" -UseBasicParsing -TimeoutSec 3 | Out-Null; $ok = $true; break }
    catch { Start-Sleep 2 }
}
if (-not $ok) { Write-Host 'The app did not respond. Logs:' -ForegroundColor Red; docker logs --tail 30 tutor-app; exit 1 }

Write-Host "Running at $url" -ForegroundColor Green
Start-Process $url
