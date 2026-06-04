"""
构建内存向量库(轻量化版,无 torch/sentence-transformers/chromadb)
- 遍历 manuals/*.md,按二级标题切分
- 调智谱 embedding-2 API 批量向量化
- 输出:
  - app/data/vectors.npy (numpy 数组,N x 1024)
  - app/data/docs.json   ([{content, source}, ...])

启动时 rag_service 直接加载这 2 个文件,内存检索 < 1ms
"""
import asyncio
import json
import os
import sys
from pathlib import Path
import numpy as np
import httpx

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings


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


async def embed_batch(texts: list[str]) -> np.ndarray:
    """调智谱 embedding-2 批量向量化"""
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

    print("[*] 调智谱 embedding-2 批量向量化...")
    texts = [c["content"] for c in all_chunks]
    vectors = await embed_batch(texts)
    print(f"    向量维度: {vectors.shape}")

    vec_path = os.path.join(settings.CHROMA_PERSIST_DIR, "vectors.npy")
    docs_path = os.path.join(settings.CHROMA_PERSIST_DIR, "docs.json")
    np.save(vec_path, vectors)
    with open(docs_path, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False)
    print(f"[+] vectors: {vec_path} ({os.path.getsize(vec_path)/1024:.1f} KB)")
    print(f"[+] docs:    {docs_path} ({os.path.getsize(docs_path)/1024:.1f} KB)")
    print("[+] 向量库构建完成")


if __name__ == "__main__":
    asyncio.run(main())
