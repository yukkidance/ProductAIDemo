"""
FastAPI 入口
- 启动时预热 RAG(加载 corpus,智谱 API keep-alive)
- CORS 从环境变量读,Render 部署时填 frontend URL
- HTTP Basic Auth:BasicAuthMiddleware 锁住整个站点(除 /health),防 Render 公开 URL 被滥用
- /health 免鉴权(Render healthcheck 必需)
- 启动时自动检查数据库和预测模型,若不存在则自动创建(应对 Render 文件系统回收)
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import knowledge, marketing, analytics, forecast
from app.core.config import settings
from app.core.auth import BasicAuthMiddleware
from app.services.rag_service import rag_service
from app.services.forecast_service import forecast_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """预热 - 避免首次请求阻塞"""
    # 1) 检查数据库是否存在,不存在则自动创建(Render 免费版可能回收文件系统)
    _ensure_db()

    # 2) 检查预测模型是否存在,不存在则自动训练
    _ensure_model()

    # 3) 预热 RAG
    print("[startup] Warming up RAG ...")
    try:
        await rag_service._load_corpus()
        print(f"[startup]   RAG corpus loaded: {len(rag_service._docs) if rag_service._docs else 0} chunks, "
              f"{rag_service._vectors.shape if rag_service._vectors is not None else 'N/A'}")
    except Exception as e:
        print(f"[startup]   RAG warmup FAILED: {e}")
        import traceback
        traceback.print_exc()

    # 4) 加载预测模型(上面 _ensure_model 可能刚训练完)
    forecast_service._load()
    print(f"[startup]   Forecast model loaded: {forecast_service.is_loaded()}")

    yield
    print("[shutdown] closing clients ...")
    try:
        from app.services.embedding_client import embedding_client
        from app.core.llm_client import llm
        await embedding_client.aclose()
        await llm.aclose()
    except Exception:
        pass


def _ensure_db():
    """确保 production.db 存在且包含演示数据,否则自动运行 seed 脚本"""
    import sqlite3
    db_path = settings.SQLITE_PATH
    # 检查文件是否存在且有表
    need_seed = True
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [r[0] for r in cur.fetchall()]
            conn.close()
            if all(t in tables for t in ["orders", "production", "oee", "workhours"]):
                need_seed = False
                print(f"[startup]   Database OK: {db_path} (tables: {', '.join(tables)})")
            else:
                print(f"[startup]   Database exists but missing tables: {db_path}")
        except Exception as e:
            print(f"[startup]   Database check failed: {e}")
    else:
        print(f"[startup]   Database not found: {db_path}")

    if need_seed:
        print("[startup]   Seeding database...")
        try:
            seed_script = _find_script("scripts/seed_production_db.py")
            if seed_script:
                project_root = os.path.dirname(os.path.dirname(seed_script))
                import subprocess
                result = subprocess.run(
                    ["python", seed_script],
                    capture_output=True,
                    text=True,
                    cwd=project_root,
                    timeout=30,
                )
                if result.returncode == 0:
                    print(f"[startup]   Database seeded OK")
                    for line in result.stdout.strip().split("\n"):
                        print(f"[startup]     {line}")
                else:
                    print(f"[startup]   Database seed FAILED: {result.stderr.strip()}")
            else:
                print(f"[startup]   Seed script not found")
        except Exception as e:
            print(f"[startup]   Database seed error: {e}")
            import traceback
            traceback.print_exc()


def _ensure_model():
    """确保预测模型文件存在,否则自动训练"""
    model_path = settings.FORECAST_MODEL_PATH
    meta_path = os.path.join(os.path.dirname(model_path), "forecast_meta.json")
    if os.path.exists(model_path) and os.path.exists(meta_path):
        print(f"[startup]   Forecast model OK: {model_path}")
        return

    print(f"[startup]   Forecast model not found, training...")
    try:
        train_script = _find_script("scripts/train_forecast_model.py")
        if train_script:
            project_root = os.path.dirname(os.path.dirname(train_script))
            import subprocess
            result = subprocess.run(
                ["python", train_script],
                capture_output=True,
                text=True,
                cwd=project_root,
                timeout=60,
            )
            if result.returncode == 0:
                print(f"[startup]   Model trained OK")
                for line in result.stdout.strip().split("\n"):
                    print(f"[startup]     {line}")
            else:
                print(f"[startup]   Model train FAILED: {result.stderr.strip()}")
        else:
            print(f"[startup]   Train script not found")
    except Exception as e:
        print(f"[startup]   Model train error: {e}")
        import traceback
        traceback.print_exc()


def _find_script(relative_path: str) -> str | None:
    """从 main.py 位置查找项目根目录下的脚本文件
    
    支持两种目录结构:
    - Render/本地: backend/app/main.py → 项目根在 ../../..
    - 其他: 向上遍历查找包含 scripts/ 的目录
    """
    # 从 backend/app/main.py 出发
    candidate = os.path.normpath(os.path.join(
        os.path.dirname(__file__), "..", "..", "..", relative_path
    ))
    if os.path.exists(candidate):
        return candidate
    
    # 回退: 向上遍历查找
    current = os.path.dirname(__file__)  # backend/app/
    for _ in range(5):
        test = os.path.join(current, relative_path)
        if os.path.exists(test):
            return test
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    
    return None


def _parse_cors() -> list[str]:
    raw = os.environ.get("ALLOWED_ORIGINS", "*")
    if raw.strip() == "*":
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(
    title="AI Portfolio API",
    description="AI 作品集后端 - 智库/营销/分析/预测 4 大模块",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 必须在 BasicAuth 之前(否则 OPTIONS 预检不带 Authorization 会被挡)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# BasicAuth 兜底所有路由(包括 /docs /openapi.json)
app.add_middleware(BasicAuthMiddleware)

app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(marketing.router, prefix="/api/marketing", tags=["marketing"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(forecast.router, prefix="/api/forecast", tags=["forecast"])


@app.get("/")
async def root():
    return {
        "name": "AI Portfolio API",
        "version": "1.0.0",
        "endpoints": [
            "/api/knowledge/chat",
            "/api/marketing/generate",
            "/api/analytics/query",
            "/api/analytics/logs",
            "/api/forecast/predict",
        ],
    }


# /health 显式免鉴权(Render healthcheck 必需,否则假报服务挂)
@app.get("/health", include_in_schema=False)
async def health():
    return {
        "status": "ok",
        "model": settings.ZHIPU_MODEL,
        "rag_loaded": rag_service.is_loaded(),
        "rag_chunks": len(rag_service._docs) if rag_service._docs else 0,
        "forecast_loaded": forecast_service.is_loaded(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.BACKEND_HOST, port=settings.BACKEND_PORT)
