"use client";
import dynamic from "next/dynamic";
import ProductPageLayout from "@/components/layout/ProductPageLayout";
import AnalyticsDemo from "@/components/demo/AnalyticsDemo";

const Architecture = dynamic(() => import("@/components/architecture/ProductArchitecture"), { ssr: false });

const HIGHLIGHTS = [
  { title: "多系统数据源整合", desc: "协同数据团队梳理 ERP/MES/QMS 三套系统 Schema,在 Prompt 中注入表结构 + 字段说明 + 业务术语映射,LLM 一次理解全局数据。" },
  { title: "Few-shot + AST 校验", desc: "Few-shot 示例让 LLM 学会标准 SQL 写法,生成后做只读白名单 + 关键字过滤(DROP/DELETE/UPDATE 拒绝)+ LIMIT 50 保护,杜绝破坏性操作。" },
  { title: "查询日志驱动报表固化", desc: "记录每次查询的 NL 与 SQL,定期聚类高频查询,推动报表团队将其固化为自助 BI 报表,持续降低 NL2SQL 调用量。" },
  { title: "结果可解释", desc: "前端回显生成的 SQL + 列名 + 行数,业务人员可一眼验证逻辑;异常 SQL 直接拒答,保证数据安全。" },
];

export default function Page() {
  return (
    <ProductPageLayout
      id="analytics"
      architecture={<Architecture flow="analytics" />}
      demo={<AnalyticsDemo />}
      highlights={HIGHLIGHTS}
    />
  );
}
