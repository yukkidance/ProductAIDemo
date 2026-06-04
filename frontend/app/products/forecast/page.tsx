"use client";
import dynamic from "next/dynamic";
import ProductPageLayout from "@/components/layout/ProductPageLayout";
import ForecastDemo from "@/components/demo/ForecastDemo";

const Architecture = dynamic(() => import("@/components/architecture/ProductArchitecture"), { ssr: false });

const HIGHLIGHTS = [
  { title: "XGBoost 时序特征工程", desc: "融合定检计划、季节性系数、机型、件类、机队规模等业务假设作为特征,而非纯时间序列,充分利用领域知识,MAPE 优于 ARIMA 30%+。" },
  { title: "分场景评价标准", desc: "安全件(0 漏报优先)与消耗件(误报率控制)采用不同损失函数与决策阈值;安全件关注 P99 上限,消耗件关注 P50 中位数。" },
  { title: "硬件零成本复用", desc: "模型仅 200 棵深度 6 的树,pkl 文件 < 1MB,直接复用现有 CPU 服务器推理,单次推理 < 50ms,无需 GPU。" },
  { title: "特征可解释 + 可优化", desc: "输出 Top-5 重要特征 + 预测 P85 区间,业务人员可直观看到「为什么是这个数」;特征权重 + 超参数均可在脚本中迭代优化。" },
];

export default function Page() {
  return (
    <ProductPageLayout
      id="forecast"
      architecture={<Architecture flow="forecast" />}
      demo={<ForecastDemo />}
      highlights={HIGHLIGHTS}
    />
  );
}
