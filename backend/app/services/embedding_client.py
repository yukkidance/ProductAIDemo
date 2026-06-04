"""
智谱 embedding-2 客户端(httpx 直调,无 openai SDK 依赖)
- 单文本 + 批量文本接口
- 启动时一次批量预热,运行时单文本检索
"""
import os
import httpx
import numpy as np
from typing import List
from app.core.config import settings


class EmbeddingClient:
    """embedding-2 中文向量化"""

    def __init__(self):
        self.api_key = settings.ZHIPUAI_API_KEY
        self.base_url = settings.ZHIPU_BASE_URL.rstrip("/")
        self.model = "embedding-2"
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )
        return self._client

    async def embed(self, text: str) -> np.ndarray:
        """单文本向量化"""
        client = self._get_client()
        r = await client.post("/embeddings", json={
            "model": self.model,
            "input": text,
        })
        r.raise_for_status()
        data = r.json()
        return np.array(data["data"][0]["embedding"], dtype=np.float32)

    async def embed_batch(self, texts: List[str]) -> np.ndarray:
        """批量向量化 - 启动时预热用"""
        client = self._get_client()
        r = await client.post("/embeddings", json={
            "model": self.model,
            "input": texts,
        })
        r.raise_for_status()
        data = r.json()
        embeddings = [item["embedding"] for item in sorted(data["data"], key=lambda x: x["index"])]
        return np.array(embeddings, dtype=np.float32)

    async def aclose(self):
        if self._client is not None:
            await self._client.aclose()
            self._client = None


embedding_client = EmbeddingClient()
