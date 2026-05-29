# NCMM Dev — Start All Services (PowerShell)
# Run: .\scripts\dev\start_all_services.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   NCMM Secure Intelligence Platform         ║" -ForegroundColor Cyan
Write-Host "║   Local Dev — Starting Core Services        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Docker is available
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found. Install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start Docker services
Write-Host "[1/2] Starting MongoDB + OPA via Docker Compose..." -ForegroundColor Yellow
Set-Location $PSScriptRoot\..\..\
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ docker-compose failed. Check Docker Desktop is running." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/2] Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check OPA health
try {
    $opaHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8181/v1/health" -Method GET -TimeoutSec 5
    Write-Host "✅ OPA: Healthy at http://127.0.0.1:8181" -ForegroundColor Green
} catch {
    Write-Host "⚠️  OPA not yet ready — may need more time to start" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NCMM Dev Stack — Start Instructions" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Docker services are up (MongoDB + OPA)." -ForegroundColor Green
Write-Host ""
Write-Host "Now open 3 terminal windows (or use VS Code launch configs):" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 — Express API:" -ForegroundColor Yellow
Write-Host "    cd backend" -ForegroundColor Gray
Write-Host "    node src\server.js" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 — Mock LLM Server:" -ForegroundColor Yellow
Write-Host "    npm run mock-llm" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 3 — React Dev Server:" -ForegroundColor Yellow
Write-Host "    cd frontend" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then open: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "VS Code: Use 'Full Dev Stack (API + Mock LLM)' compound launch config" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
