# NCMM Dev — Stop All Services (PowerShell)
# Run: .\scripts\dev\stop_all_services.ps1

Write-Host "[STOP] Stopping NCMM Docker services..." -ForegroundColor Yellow
Set-Location $PSScriptRoot\..\..\
docker-compose down

# Kill node processes on ports 3000 and 11434
Write-Host "[STOP] Killing node processes on ports 3000 and 11434..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr :3000 | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
$port11434 = netstat -ano | findstr :11434 | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique

foreach ($pid in ($port3000 + $port11434)) {
    if ($pid -match '^\d+$' -and $pid -ne '0') {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Killed PID $pid" -ForegroundColor Gray
        } catch {}
    }
}

Write-Host "✅ All services stopped." -ForegroundColor Green
