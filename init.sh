#!/usr/bin/env bash
# AI Portfolio - Mac/Linux 一键安装
# 等价于 init.bat,使用 venv 内 python 绝对路径(不依赖 activate)
set -e

cd "$(dirname "$0")"

PY_CMD="python3"
if command -v py >/dev/null 2>&1; then
    PY_CMD="py -3.12"
elif command -v python3.12 >/dev/null 2>&1; then
    PY_CMD="python3.12"
fi

if ! $PY_CMD --version >/dev/null 2>&1; then
    echo "[ERROR] Python 3.10+ not found. Install via brew/pyenv."
    exit 1
fi
echo "[OK] $($PY_CMD --version)"

# venv
if [ ! -f "backend/.venv/bin/python" ]; then
    $PY_CMD -m venv backend/.venv
    echo "[OK] venv created"
else
    echo "[SKIP] venv exists"
fi

PY="backend/.venv/bin/python"
$PY -m pip install --upgrade pip
$PY -m pip install -r backend/requirements.txt

# env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "[WARN] backend/.env created from template. EDIT ZHIPUAI_API_KEY!"
else
    echo "[OK] backend/.env exists"
fi

# frontend
if [ ! -d "frontend/node_modules" ]; then
    (cd frontend && npm config set registry https://registry.npmmirror.com && npm install)
    echo "[OK] frontend deps installed"
else
    echo "[SKIP] node_modules exists"
fi

# data(需要 API key)
export HF_ENDPOINT="${HF_ENDPOINT:-https://hf-mirror.com}"
$PY scripts/seed_manuals.py
$PY scripts/seed_production_db.py
$PY scripts/train_forecast_model.py
$PY scripts/build_vector_db.py

echo ""
echo "============================================"
echo " Setup complete!"
echo " Next: edit backend/.env (set ZHIPUAI_API_KEY), then ./start.sh"
echo "============================================"
