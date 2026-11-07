# Check Environment Dependencies for TrendMotion Studio
Write-Host "=== TrendMotion Studio Environment Verification ===" -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[MISSING] Node.js is not installed." -ForegroundColor Red
}

# Check pnpm
try {
    $pnpmVersion = pnpm -v
    Write-Host "[OK] pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "[MISSING] pnpm is not installed." -ForegroundColor Yellow
}

# Check Python
try {
    $pyVersion = python --version
    Write-Host "[OK] Python: $pyVersion" -ForegroundColor Green
} catch {
    Write-Host "[MISSING] Python is not installed." -ForegroundColor Red
}

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[MISSING] Docker is not installed or not in PATH." -ForegroundColor Yellow
}

Write-Host "===================================================" -ForegroundColor Cyan
