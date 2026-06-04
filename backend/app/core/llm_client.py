"""
智谱 GLM 统一封装(httpx 直调,无 openai SDK 依赖)
- 支持流式 (SSE) 和非流式
- 接口兼容原来的 LLMClient.chat / chat_stream
"""
import json
from typing import AsyncGenerator, List, Dict, Any
import httpx
from app.core.config import settings


class LLMClient:
    """智谱 GLM - OpenAI 兼容协议直调"""

    def __init__(self):
        self.api_key = settings.ZHIPUAI_API_KEY
        self.base_url = settings.ZHIPU_BASE_URL.rstrip("/")
        self.model = settings.ZHIPU_MODEL
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(60.0, connect=10.0),
            )
        return self._client

    async def chat_stream(
        self, messages: List[Dict[str, str]], temperature: float = 0.6, **kw
    ) -> AsyncGenerator[str, None]:
        """SSE 流式输出"""
        client = self._get_client()
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "stream": True,
            **kw,
        }
        async with client.stream("POST", "/chat/completions", json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line or not line.startswith("data: "):
                    continue
                data = line[6:].strip()
                if data == "[DONE]":
                    return
                try:
                    chunk = json.loads(data)
                    delta = chunk["choices"][0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        response_format: Dict[str, str] | None = None,
        **kw,
    ) -> str:
        """非流式 - 用于 NL2SQL 等结构化任务"""
        client = self._get_client()
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if response_format:
            payload["response_format"] = response_format
        payload.update(kw)
        r = await client.post("/chat/completions", json=payload)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"] or ""

    async def aclose(self):
        if self._client is not None:
            await self._client.aclose()
            self._client = None


llm = LLMClient()
