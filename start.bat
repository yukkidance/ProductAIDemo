@echo off
REM ============================================
REM AI Portfolio - One-click start
REM ============================================

cd /d %~dp0

echo ============================================
echo  AI Portfolio - Starting
echo ============================================
echo.

if not exist "backend\.venv\Scripts\python.exe" goto no_venv
if not exist "frontend\node_modules" goto no_npm
goto start_all

:no_venv
echo [ERROR] backend\.venv not found. Run init.bat first.
pause
exit /b 1

:no_npm
echo [ERROR] frontend\node_modules not found. Run init.bat first.
pause
exit /b 1

:start_all
echo [Cleanup] Killing any existing node/python on 3000/8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":3000 :8000" ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [Backend] FastAPI @ http://localhost:8000
start "AI-Backend" cmd /k "cd /d %~dp0backend && .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

echo [Frontend] Next.js @ http://localhost:3000
start "AI-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Two terminals opened. Wait 8-10s, then open http://localhost:3000
timeout /t 8 /nobreak >nul
start http://localhost:3000
exit /b 0
