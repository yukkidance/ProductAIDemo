"use client";
import dynamic from "next/dynamic";
import ProductPageLayout from "@/components/layout/ProductPageLayout";
import KnowledgeChat from "@/components/chat/KnowledgeChat";

const Architecture = dynamic(() => import("@/components/architecture/ProductArchitecture"), { ssr: false });

const HIGHLIGHTS = [
  { title: "开源 LLM + RAG 本地化", desc: "采用 BGE-small-zh(本地向量)+ GLM-4-Flash(智谱 API),向量库 Chroma 完全本地,敏感手册数据不出网,满足航空业数据合规要求。" },
  { title: "意图识别 + 多源检索策略", desc: "规则匹配 5 类意图(工时/排故/手册/工卡/通用),分别走不同检索路径:语义走向量、精确号走关键词+SQLite FTS5,Top-K 重排序后送入 LLM。" },
  { title: "Prompt 工程:引用 + 免责", desc: "Prompt 强制要求 LLM 标注 [引用-文件名]、对安全/工时类问题加 '以最新有效手册为准' 免责说明,降低幻觉风险。" },
  { title: "性能与可观测", desc: "向量检索 < 200ms,LLM 流式首 token < 1s;前端展示检索命中得分,方便运维监控检索质量,反向优化分块策略。" },
];

export default function Page() {
  return (
    <ProductPageLayout
      id="knowledge"
      architecture={<Architecture flow="knowledge" />}
      demo={<KnowledgeChat />}
      highlights={HIGHLIGHTS}
    />
  );
}
