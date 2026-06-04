"use client";
import { useState } from "react";
import { Send, Pen, Loader2, Check, X } from "lucide-react";
import { sseStream } from "@/lib/api";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TEMPLATES = [
  { id: "xiaohongshu", name: "小红书种草", icon: "📕" },
  { id: "wechat", name: "公众号", icon: "📱" },
  { id: "douyin", name: "抖音脚本", icon: "🎵" },
  { id: "taobao", name: "详情页", icon: "🛒" },
];

const BRANDS = [
  { id: "default", name: "默认品牌", tone: "亲和/年轻" },
  { id: "premium", name: "高端品牌", tone: "克制/品质" },
];

export default function MarketingDemo() {
  const [template, setTemplate] = useState("xiaohongshu");
  const [brand, setBrand] = useState("default");
  const [requirement, setRequirement] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<null | "accept" | "reject">(null);

  const generate = async () => {
    if (!requirement.trim() || loading) return;
    setOutput("");
    setFeedback(null);
    setLoading(true);
    let buf = "";
    try {
      for await (const ev of sseStream("/api/marketing/generate", { requirement, template, brand })) {
        buf += ev.content || "";
        setOutput(buf);
      }
    } catch (e: any) {
      setOutput(`⚠️ 生成失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 配置区 */}
      <div className="card space-y-4">
        <div>
          <label className="text-xs text-text-muted mb-1.5 block">内容模板</label>
          <div className="grid grid-cols-4 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={cn(
                  "p-2 rounded-lg text-center text-xs transition",
                  template === t.id
                    ? "bg-gradient-brand text-white"
                    : "bg-bg-elevated border border-border text-text-secondary hover:border-brand-500"
                )}
              >
                <div className="text-lg mb-0.5">{t.icon}</div>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted mb-1.5 block">品牌风格</label>
          <div className="grid grid-cols-2 gap-2">
            {BRANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBrand(b.id)}
                className={cn(
                  "p-2.5 rounded-lg text-left text-xs transition",
                  brand === b.id
                    ? "bg-brand-500/20 border border-brand-500/50 text-brand-300"
                    : "bg-bg-elevated border border-border text-text-secondary hover:border-brand-500"
                )}
              >
                <div className="font-semibold mb-0.5">{b.name}</div>
                <div className="text-text-muted">{b.tone}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted mb-1.5 block">营销需求</label>
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="例:618 大促,推一款婴儿洗衣液,卖点是'无香精、护衣'..."
            className="input min-h-[100px] resize-none"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading || !requirement.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              风格约束注入中...
            </>
          ) : (
            <>
              <Pen className="w-4 h-4" />
              生成营销文案
            </>
          )}
        </button>

        <div className="text-[10px] text-text-muted leading-relaxed pt-3 border-t border-border">
          <div className="text-brand-400 font-mono mb-1">风格约束生效中:</div>
          <div>禁用词: 最/第一/绝对/100%/神器/秒杀</div>
          <div>标志词: 让生活更轻盈 / 用心选好物</div>
        </div>
      </div>

      {/* 输出区 */}
      <div className="card flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Pen className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">生成结果</div>
              <div className="text-[10px] text-text-muted">流式输出</div>
            </div>
          </div>
          {output && !loading && (
            <div className="flex gap-1.5">
              <button
                onClick={() => setFeedback("accept")}
                className={cn(
                  "p-1.5 rounded-md transition",
                  feedback === "accept" ? "bg-accent-green/20 text-accent-green" : "text-text-muted hover:text-accent-green"
                )}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFeedback("reject")}
                className={cn(
                  "p-1.5 rounded-md transition",
                  feedback === "reject" ? "bg-red-500/20 text-red-400" : "text-text-muted hover:text-red-400"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-[300px] rounded-lg bg-bg border border-border p-4 overflow-y-auto">
          {output ? (
            <div className="prose prose-invert prose-sm max-w-none [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h1,h2,h3]:font-bold [&_h1,h2,h3]:mt-3 [&_h1,h2,h3]:mb-2 [&_p]:my-2 [&_strong]:text-pink-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              正在结合品牌风格生成...
            </div>
          ) : (
            <div className="text-text-muted text-sm text-center mt-12">点击左侧「生成营销文案」开始</div>
          )}
        </div>
        {feedback && (
          <div className="mt-3 text-xs text-center text-text-muted">
            {feedback === "accept" ? "✅ 已采纳 - 数据回写(模拟采纳率提升)" : "🔄 已驳回 - 将加入下次 Prompt 优化"}
          </div>
        )}
      </div>
    </div>
  );
}
