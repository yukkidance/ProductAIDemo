from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.rag_service import rag_service
import json

router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    history: list[dict] = []


@router.post("/chat")
async def chat(req: ChatRequest):
    """SSE 流式对话,带检索引用"""

    async def event_generator():
        async for event in rag_service.answer_stream(req.query, req.history):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/health")
async def health():
    return {"status": "ok", "module": "knowledge"}
