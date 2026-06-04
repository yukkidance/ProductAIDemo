from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.marketing_service import marketing_service
import json

router = APIRouter()


class GenerateRequest(BaseModel):
    requirement: str
    template: str = "xiaohongshu"
    brand: str = "default"


@router.post("/generate")
async def generate(req: GenerateRequest):
    """流式生成营销内容"""

    async def event_generator():
        async for chunk in marketing_service.generate_stream(
            req.requirement, req.template, req.brand
        ):
            yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/templates")
async def templates():
    return {
        "templates": [
            {"id": "xiaohongshu", "name": "小红书种草", "icon": "📕"},
            {"id": "wechat", "name": "公众号推文", "icon": "📱"},
            {"id": "douyin", "name": "抖音脚本", "icon": "🎵"},
            {"id": "taobao", "name": "电商详情页", "icon": "🛒"},
        ]
    }
