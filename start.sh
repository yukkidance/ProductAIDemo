#!/usr/bin/env bash
# AI Portfolio - Mac/Linux 一键启动
# 等价于 start.bat
set -e

cd "$(dirname "$0")"

if [ ! -f "backend/.venv/bin/python" ]; then
    echo "[ERROR] backend/.venv not found. Run ./init.sh first."
    exit 1
fi
if [ ! -d "frontend/node_modules" ]; then
    echo "[ERROR] frontend/node_modules not found. Run ./init.sh first."
    exit 1
fi

# 清理占用 3000/8000 的进程
for port in 3000 8000; do
    PIDS=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "[Cleanup] killing :$port ($PIDS)"
        kill -9 $PIDS 2>/dev/null || true
    fi
done

# 后端
echo "[Backend] FastAPI @ http://localhost:8000"
(cd backend && ./.venv/bin/python -m uvicorn app.main:app --port 8000) &
BACKEND_PID=$!

# 前端
echo "[Frontend] Next.js @ http://localhost:3000"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

cleanup() {
    echo "[shutdown] killing $BACKEND_PID $FRONTEND_PID"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "Two processes started. Wait 8-10s, then open http://localhost:3000"
wait
