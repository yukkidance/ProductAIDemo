"""
HTTP Basic Auth 中间件 - 防止 Render 公开 URL 被滥用刷智谱 token
- 所有路由(除 /health)都过 check_auth
- 密码从 settings 读(DEMO_USERNAME / DEMO_PASSWORD)
- 默认密码是 config.py 里的 32 位随机串,生产环境**必须**在 Render Dashboard 覆盖
- 用 secrets.compare_digest 防时序攻击
- check_auth 用在 router.dependencies 锁 /api/* + 根路径
- check_auth_middleware 锁 /docs /openapi.json 等 FastAPI 自动路由
"""
import base64
import secrets
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.core.config import settings


security = HTTPBasic()


def check_auth(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    """HTTP Basic Auth 校验 - 失败抛 401,浏览器自动弹窗"""
    user_ok = secrets.compare_digest(credentials.username, settings.DEMO_USERNAME)
    pass_ok = secrets.compare_digest(credentials.password, settings.DEMO_PASSWORD)
    if not (user_ok and pass_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Basic realm='AI Portfolio'"},
        )
    return credentials.username


# 免鉴权白名单(Render healthcheck 必需)
_AUTH_EXEMPT_PATHS = {"/health"}


def _parse_basic_header(header: str | None) -> tuple[str, str] | None:
    if not header or not header.startswith("Basic "):
        return None
    try:
        decoded = base64.b64decode(header[6:]).decode("utf-8")
        user, _, password = decoded.partition(":")
        return user, password
    except Exception:
        return None


class BasicAuthMiddleware(BaseHTTPMiddleware):
    """拦截所有请求(除 /health),手动校验 Basic Auth header

    用 middleware 是因为 /docs /openapi.json /redoc 等 FastAPI 自动路由
    不经过 router.dependencies,无法用 Depends(check_auth) 保护。
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in _AUTH_EXEMPT_PATHS:
            return await call_next(request)

        creds = _parse_basic_header(request.headers.get("Authorization"))
        if not creds:
            return Response(
                content='{"detail":"Authentication required"}',
                status_code=status.HTTP_401_UNAUTHORIZED,
                media_type="application/json",
                headers={"WWW-Authenticate": "Basic realm='AI Portfolio'"},
            )
        user, password = creds
        user_ok = secrets.compare_digest(user, settings.DEMO_USERNAME)
        pass_ok = secrets.compare_digest(password, settings.DEMO_PASSWORD)
        if not (user_ok and pass_ok):
            return Response(
                content='{"detail":"Invalid credentials"}',
                status_code=status.HTTP_401_UNAUTHORIZED,
                media_type="application/json",
                headers={"WWW-Authenticate": "Basic realm='AI Portfolio'"},
            )
        return await call_next(request)
