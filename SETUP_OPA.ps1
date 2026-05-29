# NCMM OPA Setup Helper Script
# Run this script in your VS Code terminal to copy OPA from D:\ to the project root and start the server.

$source = "D:\opa_windows_amd64.exe"
$dest = "e:\Secure rag\ncmm-intel-platform\opa.exe"

if (Test-Path $source) {
    Write-Host "[OPA SETUP] Copying OPA binary from $source to $dest..." -ForegroundColor Cyan
    Copy-Item -Path $source -Destination $dest -Force
    Write-Host "[OPA SETUP] ✅ OPA binary successfully copied." -ForegroundColor Green
    
    Write-Host "[OPA SETUP] Starting OPA server on port 8181..." -ForegroundColor Cyan
    Start-Process -FilePath $dest -ArgumentList "run --server --addr=localhost:8181 .\policies" -NoNewWindow
    Write-Host "[OPA SETUP] ✅ OPA server started in background." -ForegroundColor Green
} else {
    Write-Host "[OPA SETUP] ❌ Error: Could not find OPA at $source" -ForegroundColor Red
    Write-Host "Please ensure the downloaded OPA file is named 'opa_windows_amd64.exe' and placed directly on your D:\ drive." -ForegroundColor Yellow
}
