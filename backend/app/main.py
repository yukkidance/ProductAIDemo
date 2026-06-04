"""
FastAPI 入口
- 启动时预热 RAG(加载 corpus,智谱 API keep-alive)
- CORS 从环境变量读,Render 部署时填 frontend URL
- HTTP Basic Auth:BasicAuthMiddleware 锁住整个站点(除 /health),防 Render 公开 URL 被滥用
- /health 免鉴权(Render healthcheck 必需)
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
    print("[startup] Warming up RAG ...")
    try:
        await rag_service._load_corpus()
        print(f"[startup]   RAG corpus loaded: {len(rag_service._docs) if rag_service._docs else 0} chunks, "
              f"{rag_service._vectors.shape if rag_service._vectors is not None else 'N/A'}")
    except Exception as e:
        print(f"[startup]   RAG warmup FAILED: {e}")
        import traceback
        traceback.print_exc()
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
