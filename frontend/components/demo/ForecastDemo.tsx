"use client";
import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { TrendingUp, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const PART_TYPES = [
  { id: "safety", name: "安全件", desc: "零漏报优先" },
  { id: "consumable", name: "消耗件", desc: "误报率控制" },
];
const MODELS = ["A320", "B737", "B777"];

interface PredictResult {
  success: boolean;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
  evaluation_strategy: string;
  note: string;
  top_features: { name: string; importance: number }[];
  input: any;
  // 可选错误字段(后端模型未加载时返回)
  error?: string;
  loaded?: boolean;
}

export default function ForecastDemo() {
  const [partType, setPartType] = useState("consumable");
  const [aircraft, setAircraft] = useState("A320");
  const [month, setMonth] = useState(6);
  const [checkPlan, setCheckPlan] = useState(2);
  const [season, setSeason] = useState(1.0);
  const [history, setHistory] = useState(150);
  const [fleet, setFleet] = useState(40);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    setLoading(true);
    try {
      const r = await api.post<PredictResult>("/api/forecast/predict", {
        part_type: partType,
        aircraft_model: aircraft,
        month,
        check_plan: checkPlan,
        season_factor: season,
        historical_avg: history,
        fleet_count: fleet,
      });
      // 后端可能返回错误(模型未加载等)
      if (!r.data || r.data.error) {
        alert("预测服务未就绪: " + (r.data?.error || "未知错误"));
        return;
      }
      setResult(r.data);
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || "预测失败";
      alert("预测失败: " + msg);
    } finally {
      setLoading(false);
    }
  };

  // 构造历史 + 预测曲线
  const chartOption = result && {
    backgroundColor: "transparent",
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    tooltip: { trigger: "axis", backgroundColor: "#111827", borderColor: "#1f2937", textStyle: { color: "#e5e7eb" } },
    legend: { textStyle: { color: "#9ca3af" }, top: 0 },
    xAxis: {
      type: "category",
      data: ["1月","2月","3月","4月","5月",`${month}月(预测)`,`${month+1}月`,`${month+2}月`],
      axisLine: { lineStyle: { color: "#374151" } },
      axisLabel: { color: "#9ca3af", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "需求量",
      nameTextStyle: { color: "#6b7280" },
      axisLine: { lineStyle: { color: "#374151" } },
      splitLine: { lineStyle: { color: "#1f2937" } },
      axisLabel: { color: "#9ca3af", fontSize: 10 },
    },
    series: [
      {
        name: "历史消耗",
        type: "line",
        smooth: true,
        data: [
          history * 0.9, history * 0.95, history * 1.05, history * 1.0, history * 1.1,
          null, null, null,
        ],
        itemStyle: { color: "#22d3ee" },
        lineStyle: { color: "#22d3ee" },
      },
      {
        name: "预测值",
        type: "line",
        smooth: true,
        data: [null, null, null, null, history * 1.1, result.predicted_demand, result.predicted_demand * 1.03, result.predicted_demand * 0.98],
        itemStyle: { color: "#a855f7" },
        lineStyle: { color: "#a855f7", width: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(168,85,247,0.3)" }, { offset: 1, color: "rgba(168,85,247,0)" }] } },
      },
      {
        name: "P85 上界",
        type: "line",
        smooth: true,
        data: [null, null, null, null, null, result.upper_bound, result.upper_bound * 1.03, result.upper_bound * 0.98],
        itemStyle: { color: "#f59e0b" },
        lineStyle: { color: "#f59e0b", type: "dashed" },
      },
      {
        name: "P85 下界",
        type: "line",
        smooth: true,
        data: [null, null, null, null, null, result.lower_bound, result.lower_bound * 1.03, result.lower_bound * 0.98],
        itemStyle: { color: "#f59e0b" },
        lineStyle: { color: "#f59e0b", type: "dashed" },
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 配置 */}
      <div className="card space-y-4 lg:col-span-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">预测参数</div>
            <div className="text-[10px] text-text-muted">XGBoost 推理</div>
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted mb-1.5 block">件类(决定评价标准)</label>
          <div className="grid grid-cols-2 gap-2">
            {PART_TYPES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPartType(p.id)}
                className={cn(
                  "p-2 rounded-lg text-left text-xs transition",
                  partType === p.id
                    ? "bg-brand-500/20 border border-brand-500/50 text-brand-300"
                    : "bg-bg-elevated border border-border text-text-secondary hover:border-brand-500"
                )}
              >
                <div className="font-semibold">{p.name}</div>
                <div className="text-text-muted text-[10px]">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted mb-1.5 block">机型</label>
          <div className="grid grid-cols-3 gap-2">
            {MODELS.map((m) => (
              <button
                key={m}
                onClick={() => setAircraft(m)}
                className={cn(
                  "p-2 rounded-lg text-xs font-mono transition",
                  aircraft === m ? "bg-brand-500/20 border border-brand-500/50 text-brand-300" : "bg-bg-elevated border border-border text-text-secondary hover:border-brand-500"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <Slider label="月份" value={month} min={1} max={12} onChange={setMonth} />
        <Slider label={`定检计划 (${checkPlan} 级)`} value={checkPlan} min={0} max={4} onChange={setCheckPlan} />
        <Slider label={`季节性系数 (${season.toFixed(2)})`} value={season} min={0.7} max={1.3} step={0.05} onChange={setSeason} decimals={2} />
        <Slider label="历史月均消耗" value={history} min={10} max={500} step={10} onChange={setHistory} />
        <Slider label={`机队规模 (${fleet} 架)`} value={fleet} min={5} max={100} step={5} onChange={setFleet} />

        <button
          onClick={predict}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          预测需求
        </button>
      </div>

      {/* 结果 */}
      <div className="lg:col-span-2 space-y-4">
        {result ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="card">
                <div className="text-xs text-text-muted">预测需求</div>
                <div className="text-3xl font-bold gradient-text mt-1">{result.predicted_demand}</div>
                <div className="text-[10px] text-text-muted">件 / 月</div>
              </div>
              <div className="card">
                <div className="text-xs text-text-muted">预测区间 P85</div>
                <div className="text-lg font-mono mt-1 text-text-primary">
                  {result.lower_bound} ~ {result.upper_bound}
                </div>
                <div className="text-[10px] text-text-muted">安全库存建议</div>
              </div>
              <div className="card">
                <div className="text-xs text-text-muted">评价策略</div>
                <div className="text-sm font-semibold mt-1 text-orange-300">{result.evaluation_strategy}</div>
                <div className="text-[10px] text-text-muted mt-1">{result.note}</div>
              </div>
            </div>

            <div className="card">
              <div className="text-sm font-semibold mb-2">趋势预测</div>
              <ReactECharts option={chartOption!} style={{ height: 280 }} />
            </div>

            <div className="card">
              <div className="text-sm font-semibold mb-2">特征重要性(Top 5)</div>
              <div className="space-y-1.5">
                {result.top_features.map((f) => (
                  <div key={f.name} className="flex items-center gap-2 text-xs">
                    <span className="w-32 truncate font-mono text-text-secondary">{f.name}</span>
                    <div className="flex-1 h-5 bg-bg rounded overflow-hidden border border-border">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-accent-purple"
                        style={{ width: `${f.importance * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-text-primary">{(f.importance * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card h-[400px] flex flex-col items-center justify-center text-text-muted">
            <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
            <div>配置左侧参数并点击「预测需求」</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, decimals = 0 }: any) {
  return (
    <div>
      <label className="text-xs text-text-muted mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-brand-400">{decimals ? value.toFixed(decimals) : value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-brand-500"
      />
    </div>
  );
}
