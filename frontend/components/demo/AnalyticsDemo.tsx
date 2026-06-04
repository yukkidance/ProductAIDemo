"use client";
import { useState, useEffect } from "react";
import { BarChart3, Database, Loader2, FileText, History } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "上月各产线平均 OEE 排名",
  "本月各机型产量",
  "近 30 天 B 线 OEE 详情",
  "上月加班工时最多的班组",
  "本月订单金额前 5 名客户",
  "A320 机型各月产量趋势",
];

interface QueryResult {
  success: boolean;
  question?: string;
  generated_sql?: string;
  columns?: string[];
  rows?: any[];
  row_count?: number;
  error?: string;
}

interface LogSummary {
  total_queries: number;
  top_queries: { pattern: string; count: number; sample: string }[];
  report_suggestion: string;
}

export default function AnalyticsDemo() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogSummary | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const loadLogs = async () => {
    try {
      const r = await api.get<LogSummary>("/api/analytics/logs");
      setLogs(r.data);
    } catch {}
  };
  useEffect(() => { loadLogs(); }, []);

  const query = async (q?: string) => {
    const text = q || question;
    if (!text.trim() || loading) return;
    setQuestion(text);
    setResult(null);
    setLoading(true);
    try {
      const r = await api.post<QueryResult>("/api/analytics/query", { question: text });
      setResult(r.data);
      loadLogs();
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">NL2SQL 问数</div>
            <div className="text-xs text-text-muted">GLM-4-Flash 转 SQL · 自动校验 · 限只读 · LIMIT 50</div>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="ml-auto btn-secondary text-xs flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            查询日志 ({logs?.total_queries || 0})
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => query(s)}
              disabled={loading}
              className="text-[11px] px-2 py-1 rounded-md bg-bg-elevated border border-border text-text-secondary hover:border-brand-500 hover:text-text-primary transition disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && query()}
            disabled={loading}
            placeholder="例:上月 A320 机型各产线 OEE 平均值"
            className="input flex-1"
          />
          <button
            onClick={() => query()}
            disabled={loading || !question.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "查询"}
          </button>
        </div>
      </div>

      {showLogs && logs && (
        <div className="card">
          <div className="text-sm font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            高频查询分析
          </div>
          <div className="text-xs text-text-muted mb-3">{logs.report_suggestion}</div>
          <div className="space-y-1.5">
            {logs.top_queries.length === 0 ? (
              <div className="text-xs text-text-muted">暂无日志,发起几次查询后会累积</div>
            ) : (
              logs.top_queries.map((q, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-bg-elevated">
                  <span className="truncate flex-1">{q.sample}</span>
                  <span className="badge-brand">×{q.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="card animate-fade-in">
          {result.success ? (
            <>
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2 text-text-muted">
                  <FileText className="w-3.5 h-3.5" />
                  返回 {result.row_count} 行
                </div>
                <div className="font-mono text-[10px] text-text-muted">SQL ↓</div>
              </div>
              <pre className="text-[11px] font-mono text-accent-cyan bg-bg p-3 rounded-lg overflow-x-auto mb-3 border border-border">
{result.generated_sql}
              </pre>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-bg-elevated">
                    <tr>
                      {result.columns?.map((c) => (
                        <th key={c} className="text-left px-3 py-2 font-semibold text-text-secondary">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows?.map((row, i) => (
                      <tr key={i} className="border-t border-border hover:bg-bg-elevated/50">
                        {result.columns?.map((c) => (
                          <td key={c} className="px-3 py-2 font-mono text-text-primary">
                            {row[c] === null ? <span className="text-text-muted">NULL</span> : String(row[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-red-400 text-sm">⚠️ {result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
