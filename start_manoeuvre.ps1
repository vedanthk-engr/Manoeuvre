# Manoeuvre Studio — Unified PowerShell Launcher
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "          MANOEUVRE STUDIO - WEARABLE HARDWARE INTEGRATION           " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonExe = Join-Path $RootPath ".venv\Scripts\python.exe"

# 1. Check Python Virtual Environment
if (-not (Test-Path $PythonExe)) {
    Write-Host "[ERROR] Virtual environment not found at $PythonExe!" -ForegroundColor Red
    Write-Host "Please create it using: py -m venv .venv; .venv\Scripts\pip install -r backend\requirements.txt"
    exit 1
}

# 2. Display Machine LAN IP Addresses (for NodeMCU Glove Config.h)
Write-Host "[NETWORK] Local IPv4 Address(es) for Glove Configuration:" -ForegroundColor Yellow
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback|vEthernet" -and $_.IPAddress -notlike "169.254*" } | ForEach-Object {
    Write-Host "  -> $($_.IPAddress) ($($_.InterfaceAlias))" -ForegroundColor Green
}
Write-Host ""
Write-Host "[CONFIG] NodeMCU Glove WebSocket Target:" -ForegroundColor Yellow
Write-Host "  ws://<YOUR_LOCAL_IP>:8000/ws/device   (or /ws)" -ForegroundColor White
Write-Host ""

# 3. Start Backend Core
Write-Host "[1/3] Starting Manoeuvre Core backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
$BackendJob = Start-Process -FilePath $PythonExe -ArgumentList "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory $RootPath -PassThru -NoNewWindow

# 4. Wait for Backend Health Check
Write-Host "[2/3] Waiting for backend to become ready..." -ForegroundColor Cyan
$Healthy = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($res.status -in @("ok", "HEALTHY")) {
            $Healthy = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

if ($Healthy) {
    Write-Host "[OK] Backend Core is live and healthy!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Backend health probe timed out. Continuing launch..." -ForegroundColor Yellow
}

# 5. Launch Studio Frontend
Write-Host "[3/3] Launching Manoeuvre Studio..." -ForegroundColor Cyan
Set-Location (Join-Path $RootPath "frontend")

try {
    npm run dev
} finally {
    if ($BackendJob -and -not $BackendJob.HasExited) {
        Write-Host "Stopping backend process..." -ForegroundColor Gray
        Stop-Process -Id $BackendJob.Id -Force -ErrorAction SilentlyContinue
    }
}
