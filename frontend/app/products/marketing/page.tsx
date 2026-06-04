"use client";
import dynamic from "next/dynamic";
import ProductPageLayout from "@/components/layout/ProductPageLayout";
import MarketingDemo from "@/components/demo/MarketingDemo";

const Architecture = dynamic(() => import("@/components/architecture/ProductArchitecture"), { ssr: false });

const HIGHLIGHTS = [
  { title: "成本测算驱动 MVP 选型", desc: "基于月度用量(月 1000 条素材 × 1500 token)测算,自建开源 LLM 月均 GPU 成本 ¥3000+,直接调用 API 仅 ¥300,确定 MVP 走 API 方案,后续用量起来再考虑私有化。" },
  { title: "品牌风格约束即代码", desc: "将禁用词、标志性表达、语气、emoji 规则抽取为 JSON,注入 Prompt System 层,运营改文案无需开发介入,降低迭代成本。" },
  { title: "多模态模板结构化", desc: "小红书/公众号/抖音/详情页各自定义标题-开头-中间-结尾-标签结构,Prompt 动态注入,生成内容天然符合平台调性。" },
  { title: "采纳率作为北极星指标", desc: "前端提供采纳/驳回按钮,数据回写日志;定期分析未采纳案例,提取共性问题反向优化 Prompt 与风格规则,持续提升一次通过率。" },
];

export default function Page() {
  return (
    <ProductPageLayout
      id="marketing"
      architecture={<Architecture flow="marketing" />}
      demo={<MarketingDemo />}
      highlights={HIGHLIGHTS}
    />
  );
}
