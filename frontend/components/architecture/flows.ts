import { Edge, Node } from "reactflow";
import { ArchNodeData } from "./ArchNode";

export const knowledgeFlow = (): { nodes: Node<ArchNodeData>[]; edges: Edge[] } => ({
  nodes: [
    { id: "u", type: "arch", position: { x: 0, y: 200 }, data: { label: "机务人员提问", detail: "自然语言输入,工卡/工时/排故等", kind: "input", tech: "Web UI" } },
    { id: "i", type: "arch", position: { x: 240, y: 200 }, data: { label: "意图识别分类", detail: "规则匹配:工时/排故/手册/工卡/通用", kind: "process", tech: "FastAPI + Rule" } },
    { id: "v1", type: "arch", position: { x: 480, y: 80 }, data: { label: "向量检索", detail: "BGE-zh 嵌入 + Chroma 相似度", kind: "service", tech: "BGE-small-zh" } },
    { id: "v2", type: "arch", position: { x: 480, y: 220 }, data: { label: "关键词检索", detail: "工卡号/件号精确匹配,AMM章节定位", kind: "service", tech: "SQLite FTS5" } },
    { id: "r", type: "arch", position: { x: 480, y: 360 }, data: { label: "重排序", detail: "Top-K 排序,去重,引用溯源", kind: "process" } },
    { id: "p", type: "arch", position: { x: 720, y: 200 }, data: { label: "Prompt 约束模板", detail: "角色/引用/免责/结构化输出", kind: "process", tech: "Few-shot" } },
    { id: "l", type: "arch", position: { x: 960, y: 200 }, data: { label: "LLM 生成", detail: "GLM-4-Flash 流式输出", kind: "llm", tech: "Zhipu API" } },
    { id: "o", type: "arch", position: { x: 1200, y: 200 }, data: { label: "结构化回答", detail: "结论+说明+引用源", kind: "output", tech: "SSE Stream" } },
  ],
  edges: [
    { id: "e1", source: "u", target: "i", animated: true, type: "smoothstep" },
    { id: "e2", source: "i", target: "v1", animated: true, type: "smoothstep", label: "语义" },
    { id: "e3", source: "i", target: "v2", animated: true, type: "smoothstep", label: "精确" },
    { id: "e4", source: "i", target: "r", animated: true, type: "smoothstep" },
    { id: "e5", source: "v1", target: "r", type: "smoothstep" },
    { id: "e6", source: "v2", target: "r", type: "smoothstep" },
    { id: "e7", source: "r", target: "p", animated: true, type: "smoothstep" },
    { id: "e8", source: "p", target: "l", animated: true, type: "smoothstep" },
    { id: "e9", source: "l", target: "o", animated: true, type: "smoothstep" },
  ],
});

export const marketingFlow = (): { nodes: Node<ArchNodeData>[]; edges: Edge[] } => ({
  nodes: [
    { id: "u", type: "arch", position: { x: 0, y: 200 }, data: { label: "运营/营销需求", detail: "活动主题、平台、目标人群", kind: "input" } },
    { id: "t", type: "arch", position: { x: 240, y: 200 }, data: { label: "多模态模板选择", detail: "小红书/公众号/抖音/详情页", kind: "process", tech: "4 模板" } },
    { id: "b", type: "arch", position: { x: 480, y: 200 }, data: { label: "品牌风格约束", detail: "禁用词/标志性表达/语气/Emoji", kind: "process", tech: "JSON Rules" } },
    { id: "l", type: "arch", position: { x: 720, y: 200 }, data: { label: "LLM 生成", detail: "GLM-4-Flash 流式", kind: "llm", tech: "Zhipu API" } },
    { id: "c", type: "arch", position: { x: 960, y: 80 }, data: { label: "合规审核", detail: "敏感词扫描 + 禁用词过滤", kind: "process", tech: "AC 自动机" } },
    { id: "o", type: "arch", position: { x: 1200, y: 200 }, data: { label: "多模态内容", detail: "文案 + 配图建议 + 标签", kind: "output" } },
    { id: "f", type: "arch", position: { x: 960, y: 320 }, data: { label: "采纳反馈闭环", detail: "采纳/驳回数据回写,反向优化 Prompt", kind: "data", tech: "采纳率指标" } },
  ],
  edges: [
    { id: "e1", source: "u", target: "t", animated: true, type: "smoothstep" },
    { id: "e2", source: "t", target: "b", animated: true, type: "smoothstep" },
    { id: "e3", source: "b", target: "l", animated: true, type: "smoothstep" },
    { id: "e4", source: "l", target: "c", animated: true, type: "smoothstep" },
    { id: "e5", source: "c", target: "o", animated: true, type: "smoothstep" },
    { id: "e6", source: "f", target: "b", type: "smoothstep", label: "优化" },
  ],
});

export const analyticsFlow = (): { nodes: Node<ArchNodeData>[]; edges: Edge[] } => ({
  nodes: [
    { id: "u", type: "arch", position: { x: 0, y: 200 }, data: { label: "管理者提问", detail: "自然语言,如:上月 OEE 最低产线", kind: "input" } },
    { id: "s", type: "arch", position: { x: 240, y: 200 }, data: { label: "Schema 检索", detail: "匹配相关表与字段", kind: "process", tech: "Prompt 注入" } },
    { id: "n", type: "arch", position: { x: 480, y: 200 }, data: { label: "NL2SQL 转换", detail: "LLM 生成 SQLite 标准 SQL", kind: "llm", tech: "Few-shot" } },
    { id: "g", type: "arch", position: { x: 720, y: 200 }, data: { label: "SQL 校验", detail: "只读白名单 + LIMIT 50", kind: "process", tech: "AST Guard" } },
    { id: "d1", type: "arch", position: { x: 960, y: 80 }, data: { label: "ERP", detail: "订单/客户/财务", kind: "data" } },
    { id: "d2", type: "arch", position: { x: 960, y: 200 }, data: { label: "MES", detail: "产量/工时/OEE", kind: "data" } },
    { id: "d3", type: "arch", position: { x: 960, y: 320 }, data: { label: "QMS", detail: "质量/返工/保留", kind: "data" } },
    { id: "v", type: "arch", position: { x: 1200, y: 200 }, data: { label: "可视化结果", detail: "表格 + 图表 + SQL 回显", kind: "output" } },
    { id: "l", type: "arch", position: { x: 720, y: 380 }, data: { label: "查询日志分析", detail: "高频查询聚类,固化为报表", kind: "data", tech: "Counter" } },
  ],
  edges: [
    { id: "e1", source: "u", target: "s", animated: true, type: "smoothstep" },
    { id: "e2", source: "s", target: "n", animated: true, type: "smoothstep" },
    { id: "e3", source: "n", target: "g", animated: true, type: "smoothstep" },
    { id: "e4", source: "g", target: "d1", animated: true, type: "smoothstep" },
    { id: "e5", source: "g", target: "d2", animated: true, type: "smoothstep" },
    { id: "e6", source: "g", target: "d3", animated: true, type: "smoothstep" },
    { id: "e7", source: "d1", target: "v", type: "smoothstep" },
    { id: "e8", source: "d2", target: "v", type: "smoothstep" },
    { id: "e9", source: "d3", target: "v", type: "smoothstep" },
    { id: "e10", source: "v", target: "l", type: "smoothstep", label: "分析" },
    { id: "e11", source: "l", target: "n", type: "smoothstep", label: "固化" },
  ],
});

export const forecastFlow = (): { nodes: Node<ArchNodeData>[]; edges: Edge[] } => ({
  nodes: [
    { id: "h", type: "arch", position: { x: 0, y: 100 }, data: { label: "历史消耗数据", detail: "航材 24 月消耗记录", kind: "data", tech: "CSV" } },
    { id: "b", type: "arch", position: { x: 0, y: 280 }, data: { label: "业务假设输入", detail: "定检计划/季节性/机队规模", kind: "input" } },
    { id: "f", type: "arch", position: { x: 240, y: 200 }, data: { label: "特征工程", detail: "One-hot + 数值缩放", kind: "process", tech: "Pandas" } },
    { id: "x", type: "arch", position: { x: 480, y: 200 }, data: { label: "XGBoost 模型", detail: "200 棵树 / 深度 6 / lr=0.1", kind: "llm", tech: "Joblib" } },
    { id: "p", type: "arch", position: { x: 720, y: 200 }, data: { label: "预测输出", detail: "需求量 + P85 上下界", kind: "output" } },
    { id: "e", type: "arch", position: { x: 960, y: 100 }, data: { label: "安全件评价", detail: "零漏报优先,关注 P99", kind: "process" } },
    { id: "f2", type: "arch", position: { x: 960, y: 280 }, data: { label: "消耗件评价", detail: "误报率控制,关注 P50", kind: "process" } },
    { id: "i", type: "arch", position: { x: 1200, y: 200 }, data: { label: "库存建议", detail: "周转天数 ↓ 18%", kind: "output" } },
  ],
  edges: [
    { id: "e1", source: "h", target: "f", animated: true, type: "smoothstep" },
    { id: "e2", source: "b", target: "f", animated: true, type: "smoothstep" },
    { id: "e3", source: "f", target: "x", animated: true, type: "smoothstep" },
    { id: "e4", source: "x", target: "p", animated: true, type: "smoothstep" },
    { id: "e5", source: "p", target: "e", type: "smoothstep" },
    { id: "e6", source: "p", target: "f2", type: "smoothstep" },
    { id: "e7", source: "e", target: "i", type: "smoothstep" },
    { id: "e8", source: "f2", target: "i", type: "smoothstep" },
  ],
});

export const FLOWS = {
  knowledge: { name: "智库机器人", build: knowledgeFlow },
  marketing: { name: "营销生成器", build: marketingFlow },
  analytics: { name: "生产分析助手", build: analyticsFlow },
  forecast: { name: "供应链预测", build: forecastFlow },
} as const;

export type FlowKey = keyof typeof FLOWS;
