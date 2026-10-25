@echo off
setlocal EnableDelayedExpansion
title Manoeuvre Studio — Unified Launcher

echo =====================================================================
echo           MANOEUVRE STUDIO - WEARABLE HARDWARE INTEGRATION           
echo =====================================================================
echo.

:: 1. Check Python Virtual Environment
if not exist "%~dp0.venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at .venv\Scripts\python.exe!
    echo Please create it using: py -m venv .venv ^&^& .venv\Scripts\pip install -r backend\requirements.txt
    pause
    exit /b 1
)

:: 2. Display Machine LAN IP Addresses (for NodeMCU Glove Config.h)
echo [NETWORK] Local IPv4 Address(es) for Glove Configuration:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP: =!
    echo   -^> !IP!
)
echo.
echo [CONFIG] NodeMCU Glove WebSocket Target:
echo   ws://^<YOUR_LOCAL_IP^>:8000/ws/device   (or /ws)
echo.

:: 3. Start Backend Core
echo [1/3] Starting Manoeuvre Core backend on http://127.0.0.1:8000 ...
start /B "" "%~dp0.venv\Scripts\python.exe" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000

:: 4. Wait for Backend Health Check
echo [2/3] Waiting for backend to become ready...
set READY=0
for /L %%i in (1,1,15) do (
    curl -s http://127.0.0.1:8000/health >nul 2>&1
    if !errorlevel! equ 0 (
        set READY=1
        goto :BackendReady
    )
    timeout /T 1 /NOBREAK >nul
)

:BackendReady
if %READY% neq 1 (
    echo [WARNING] Backend did not respond within 15s. Launching Studio anyway...
) else (
    echo [OK] Backend Core is live and healthy!
)

:: 5. Launch Studio Frontend
echo [3/3] Launching Manoeuvre Studio...
cd "%~dp0frontend"
npm run dev

pause
