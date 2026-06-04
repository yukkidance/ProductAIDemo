"""
智库机器人 - 意图分类 + 内存向量检索 + Prompt 约束
- Embedding:智谱 embedding-2 API(httpx 直调)
- 检索:启动时加载 vectors.npy + docs.json,运行时纯 numpy cosine
"""
import os
import numpy as np
from typing import List, Dict, AsyncGenerator
from app.core.config import settings
from app.core.llm_client import llm
from app.services.embedding_client import embedding_client


class RAGService:
    """智库机器人 - 意图分类 + 向量检索 + Prompt 约束"""

    def __init__(self):
        self._docs: List[Dict] | None = None
        self._vectors: np.ndarray | None = None
        self._loaded = False

    async def _load_corpus(self):
        """从本地文件加载预计算的向量库(启动时一次)"""
        if self._loaded:
            return
        vec_path = os.path.join(settings.CHROMA_PERSIST_DIR, "vectors.npy")
        docs_path = os.path.join(settings.CHROMA_PERSIST_DIR, "docs.json")
        if not (os.path.exists(vec_path) and os.path.exists(docs_path)):
            raise FileNotFoundError(
                f"向量库未构建。请先运行 scripts/build_vector_db.py 生成 {vec_path}"
            )
        import json
        with open(docs_path, "r", encoding="utf-8") as f:
            self._docs = json.load(f)
        self._vectors = np.load(vec_path)
        self._loaded = True

    def is_loaded(self) -> bool:
        return self._loaded

    def _classify_intent(self, query: str) -> str:
        """意图识别分类(规则匹配,5 类 + 默认通用)"""
        rules = [
            ("工时", ["工时", "标准时间", "多久", "需要多长时间", "工卡"]),
            ("排故", ["故障", "排故", "异常", "为什么", "原因", "处理"]),
            ("手册", ["手册", "AMM", "手册规定", "章节", "SOP"]),
            ("工卡", ["工卡", "工作单", "卡控", "必检"]),
        ]
        for intent, keywords in rules:
            if any(k in query for k in keywords):
                return intent
        return "通用"

    def _cosine_topk(self, q_vec: np.ndarray, top_k: int = 3) -> List[Dict]:
        """纯 numpy cosine 检索 - 30 chunk 规模 < 1ms"""
        q_norm = q_vec / (np.linalg.norm(q_vec) + 1e-12)
        v_norms = self._vectors / (np.linalg.norm(self._vectors, axis=1, keepdims=True) + 1e-12)
        sims = v_norms @ q_norm
        top_idx = np.argsort(-sims)[:top_k]
        return [
            {
                "content": self._docs[int(i)]["content"],
                "source": self._docs[int(i)]["source"],
                "score": float(sims[int(i)]),
            }
            for i in top_idx
        ]

    async def _retrieve(self, query: str, top_k: int = 3) -> List[Dict]:
        """单次检索 = embed API + numpy cosine"""
        await self._load_corpus()
        q_vec = await embedding_client.embed(query)
        return self._cosine_topk(q_vec, top_k)

    def _build_prompt(self, query: str, context_docs: List[Dict], intent: str) -> List[Dict]:
        """Prompt 约束 - 引用规则、风格、安全"""
        context_text = "\n\n---\n\n".join(
            [f"[引用{doc['source']}]\n{doc['content']}" for doc in context_docs]
        )
        system_prompt = f"""你是机务维修领域专家助手"航小智"。

【角色约束】
- 仅基于提供的引用内容回答,不得编造数据/工时/标准
- 必须标注引用来源(格式:[引用-文件名])
- 工时/工卡类问题必须给出明确数值
- 涉及安全的回答必须包含"以最新有效手册为准"的免责说明

【回答结构】
1. 简要结论
2. 详细说明
3. 引用来源

【意图分类】本次问题类型:{intent}
"""
        user_prompt = f"""【用户问题】{query}

【引用知识】
{context_text}

请基于以上引用给出专业回答。"""
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    async def answer_stream(
        self, query: str, history: List[Dict] = []
    ) -> AsyncGenerator[Dict, None]:
        """流式回答"""
        intent = self._classify_intent(query)
        docs = await self._retrieve(query)
        yield {
            "type": "meta",
            "intent": intent,
            "sources": [
                {"source": d["source"], "score": round(d["score"], 3)}
                for d in docs
            ],
        }
        messages = self._build_prompt(query, docs, intent)
        for h in history[-3:]:
            messages.insert(1, h)
        async for chunk in llm.chat_stream(messages, temperature=0.3):
            yield {"type": "token", "content": chunk}


rag_service = RAGService()
