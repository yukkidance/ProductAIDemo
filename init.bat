@echo off
REM ============================================
REM AI Portfolio - One-click install + init
REM Pure English to avoid GBK encoding issues
REM ============================================

cd /d %~dp0

echo ============================================
echo  AI Portfolio - Setup
echo ============================================
echo.

echo [1/6] Checking Python...
py -3.12 --version >nul 2>&1
if errorlevel 1 goto try_py_default
py -3.12 --version
set PY_CMD=py -3.12
goto py_ok

:try_py_default
python --version >nul 2>&1
if errorlevel 1 goto py_missing
python --version
set PY_CMD=python
goto py_ok

:py_missing
echo [ERROR] Python not found. Install Python 3.10+ and add to PATH.
echo Download: https://www.python.org/downloads/
pause
exit /b 1

:py_ok
echo.
echo [2/6] Creating backend venv ...
if exist "backend\.venv\Scripts\python.exe" goto venv_skip
%PY_CMD% -m venv backend\.venv
if errorlevel 1 goto err
echo       venv created
goto venv_done
:venv_skip
echo       venv exists, skip
:venv_done

echo.
echo [3/6] Installing backend deps (2-3 min)...
REM Use pypi.org official - tsinghua mirror misses torch 2.5-2.8
backend\.venv\Scripts\python.exe -m pip install --upgrade pip
if errorlevel 1 goto err
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if errorlevel 1 goto err
REM Fix chromadb missing optional deps (overrides, posthog, pypika, tenacity)
backend\.venv\Scripts\python.exe -m pip install "chromadb==0.5.23" overrides pypika tenacity posthog "tokenizers>=0.22.0,<=0.23.0" "numpy<2.0" --upgrade
if errorlevel 1 goto err
REM chromadb==0.5.3 pins chroma-hnswlib==0.7.3 which has no cp312 win_amd64 wheel
REM (would need MSVC++ 14.0 to build from source).
REM 0.7.6 stable also has no cp312 win_amd64 wheel. 0.7.5 is the newest with a wheel.
REM Trick: build a temp requirements without the chromadb line, install everything else first
REM (resolving all transitive deps), pre-install chroma-hnswlib==0.7.5 wheel, then --no-deps
REM install chromadb itself (its declared deps are already pulled in by other packages).
findstr /v /b /c:"chromadb==" backend\requirements.txt > "%TEMP%\req_no_chromadb.txt"
backend\.venv\Scripts\python.exe -m pip install --only-binary=:all: chroma-hnswlib==0.7.5
if errorlevel 1 goto err
backend\.venv\Scripts\python.exe -m pip install -r "%TEMP%\req_no_chromadb.txt"
if errorlevel 1 goto err
backend\.venv\Scripts\python.exe -m pip install --no-deps chromadb==0.5.3
if errorlevel 1 goto err
del "%TEMP%\req_no_chromadb.txt" 2>nul

echo.
echo [4/6] Checking backend\.env ...
if exist "backend\.env" goto env_skip
if not exist "backend\.env.example" goto env_missing
copy "backend\.env.example" "backend\.env" >nul
echo       backend\.env created from template
echo       *** Edit backend\.env to fill in ZHIPUAI_API_KEY ***
goto env_done
:env_skip
echo       backend\.env exists
goto env_done
:env_missing
echo [ERROR] backend\.env.example not found
goto err
:env_done

echo.
echo [5/6] Installing frontend deps (1-2 min)...
if exist "frontend\node_modules" goto npm_skip
cd frontend
call npm install --registry https://registry.npmmirror.com
if errorlevel 1 goto npm_err
cd ..
echo       frontend deps installed
goto npm_done
:npm_err
cd ..
goto err
:npm_skip
echo       node_modules exists, skip
:npm_done

echo.
echo [6/6] Initializing data (first run downloads ~90MB BGE model)...
REM Use HF mirror to bypass huggingface.co blockage
set HF_ENDPOINT=https://hf-mirror.com
set ANONYMIZED_TELEMETRY=False
backend\.venv\Scripts\python.exe scripts\seed_manuals.py
if errorlevel 1 goto err
backend\.venv\Scripts\python.exe scripts\seed_production_db.py
if errorlevel 1 goto err
backend\.venv\Scripts\python.exe scripts\train_forecast_model.py
if errorlevel 1 goto err
backend\.venv\Scripts\python.exe scripts\build_vector_db.py
if errorlevel 1 goto err

echo.
echo ============================================
echo  Setup complete!
echo  Next:
echo    1. Make sure backend\.env has ZHIPUAI_API_KEY
echo    2. Double-click start.bat
echo ============================================
echo.
pause
exit /b 0

:err
echo.
echo [ERROR] Setup failed. Check messages above.
pause
exit /b 1
