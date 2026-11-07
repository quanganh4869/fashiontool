# Start Local Infrastructure (PostgreSQL & Redis)
Write-Host "Starting TrendMotion Studio infra (PostgreSQL & Redis)..." -ForegroundColor Cyan
docker compose up -d

Write-Host "Waiting for containers to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
docker compose ps
