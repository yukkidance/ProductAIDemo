"""
构建内存向量库(轻量化版,无 torch/sentence-transformers/chromadb)
- 遍历 manuals/*.md,按二级标题切分
- 调智谱 embedding-2 API 批量向量化
- 智谱 key 缺失时降级为 hash 伪 embedding(本地无 key 测试用)
- 输出:
  - app/data/vectors.npy (numpy 数组,N x 1024)
  - app/data/docs.json   ([{content, source}, ...])

启动时 rag_service 直接加载这 2 个文件,内存检索 < 1ms
"""
import asyncio
import hashlib
import json
import os
import sys
from pathlib import Path
import numpy as np
import httpx

BACKEND_DIR = Path.cwd() / "backend"
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings


_PLACEHOLDER_KEYS = {"", "your_api_key", "your_api_key_here"}


def split_md(content: str, source: str) -> list[dict]:
    """按二级标题切分文档"""
    chunks = []
    current_h2 = ""
    buffer = []
    for line in content.split("\n"):
        if line.startswith("## "):
            if buffer:
                chunks.append({
                    "content": "\n".join(buffer).strip(),
                    "source": f"{source}#{current_h2}",
                })
            current_h2 = line[3:].strip()
            buffer = [line]
        else:
            buffer.append(line)
    if buffer:
        chunks.append({
            "content": "\n".join(buffer).strip(),
            "source": f"{source}#{current_h2}",
        })
    return [c for c in chunks if len(c["content"]) > 20]


def _hash_embed(text: str, dim: int = 1024) -> np.ndarray:
    """SHA-256 伪 embedding(无语义,仅供本地无 key 时启动 RAG 流程)

    维度默认 1024,对齐智谱 embedding-2,这样用户填真 key 后重 build
    无需手动清旧 vectors.npy(否则会触发 shape 不匹配)。
    """
    raw = b""
    seed = text.encode("utf-8")
    while len(raw) < dim * 4:
        raw += hashlib.sha256(raw + seed).digest()
    arr = np.frombuffer(raw[: dim * 4], dtype=np.float32).copy()
    return arr / (np.linalg.norm(arr) + 1e-12)


def _hash_embed_batch(texts: list[str], dim: int = 1024) -> np.ndarray:
    return np.stack([_hash_embed(t, dim) for t in texts])


async def embed_batch(texts: list[str]) -> np.ndarray:
    """调智谱 embedding-2 批量向量化;key 缺失时降级为 hash 伪 embedding"""
    if settings.ZHIPUAI_API_KEY in _PLACEHOLDER_KEYS:
        print("[!] ZHIPUAI_API_KEY 是占位符,降级为 hash 伪 embedding(仅本地无 key 测试)")
        print("[!]   检索质量差(无语义),仅保证后端能启动 + RAG 流程能跑通")
        print("[!]   填真 key 后重跑本脚本即可升级为真实向量")
        return _hash_embed_batch(texts)
    headers = {
        "Authorization": f"Bearer {settings.ZHIPUAI_API_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(base_url=settings.ZHIPU_BASE_URL, headers=headers, timeout=60.0) as client:
        r = await client.post("/embeddings", json={
            "model": "embedding-2",
            "input": texts,
        })
        r.raise_for_status()
        data = r.json()
        embs = [item["embedding"] for item in sorted(data["data"], key=lambda x: x["index"])]
        return np.array(embs, dtype=np.float32)


async def main():
    print(f"[*] 输出目录: {settings.CHROMA_PERSIST_DIR}")
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

    manuals_dir = Path("app/data/manuals")
    md_files = sorted(manuals_dir.glob("*.md"))
    print(f"[*] 发现 {len(md_files)} 篇手册")

    all_chunks = []
    for md_file in md_files:
        content = md_file.read_text(encoding="utf-8")
        chunks = split_md(content, md_file.name)
        print(f"    {md_file.name}: {len(chunks)} 个段落")
        all_chunks.extend(chunks)
    print(f"[*] 共 {len(all_chunks)} 个段落")

    vec_path = os.path.join(settings.CHROMA_PERSIST_DIR, "vectors.npy")
    docs_path = os.path.join(settings.CHROMA_PERSIST_DIR, "docs.json")

    # 缓存命中检查:已有 vectors.npy 且 chunks 数量一致,跳过调 API(节省 embedding token)
    if os.path.exists(vec_path) and os.path.exists(docs_path):
        existing = np.load(vec_path)
        with open(docs_path, "r", encoding="utf-8") as f:
            existing_docs = json.load(f)
        if existing.shape[0] == len(all_chunks):
            print(f"[=] vectors.npy 已存在且 shape 匹配 ({existing.shape}),跳过 embedding API")
            print(f"[=]   如需重建(手册内容更新后),手动删除 {vec_path} 再重跑本脚本")
            print(f"[+] 向量库已就绪(缓存命中)")
            return
        else:
            print(f"[!] vectors.npy 存在但 chunk 数不匹配(库 {existing.shape[0]} vs 当前 {len(all_chunks)}),需重建")

    print("[*] 调智谱 embedding-2 批量向量化(或降级为 hash)...")
    texts = [c["content"] for c in all_chunks]
    vectors = await embed_batch(texts)
    print(f"    向量维度: {vectors.shape}")

    np.save(vec_path, vectors)
    with open(docs_path, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False)
    print(f"[+] vectors: {vec_path} ({os.path.getsize(vec_path)/1024:.1f} KB)")
    print(f"[+] docs:    {docs_path} ({os.path.getsize(docs_path)/1024:.1f} KB)")
    print("[+] 向量库构建完成")


if __name__ == "__main__":
    asyncio.run(main())
