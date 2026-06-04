"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, FileText, Sparkles, Loader2 } from "lucide-react";
import { sseStream } from "@/lib/api";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Source { source: string; score: number }
interface Message {
  role: "user" | "assistant";
  content: string;
  meta?: { intent?: string; sources?: Source[] };
}

const SUGGESTIONS = [
  "A320 起落架 C 检查工时是多少?",
  "B737NG 发动机换发需要什么条件?",
  "EEC 故障码 73-1234 怎么排故?",
  "航后工卡必检项目有哪些?",
];

export default function KnowledgeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好,我是**航小智**,机务维修领域知识助手。\n\n可基于 6 篇机务手册(AMM/工卡/排故指南)为你提供带引用溯源的解答。\n\n试试点击下方示例问题 👇",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    let assistantContent = "";
    let meta: Message["meta"] = {};

    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      for await (const event of sseStream("/api/knowledge/chat", { query: text, history: [] })) {
        if (event.type === "meta") {
          meta = { intent: event.intent, sources: event.sources, scores: event.scores };
          setMessages((m) => {
            const newM = [...m];
            newM[newM.length - 1] = { ...newM[newM.length - 1], meta };
            return newM;
          });
        } else if (event.type === "token") {
          assistantContent += event.content;
          setMessages((m) => {
            const newM = [...m];
            newM[newM.length - 1] = {
              ...newM[newM.length - 1],
              content: assistantContent,
              meta,
            };
            return newM;
          });
        }
      }
    } catch (e: any) {
      setMessages((m) => {
        const newM = [...m];
        newM[newM.length - 1] = { ...newM[newM.length - 1], content: `⚠️ 调用失败: ${e.message}` };
        return newM;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-0 overflow-hidden flex flex-col h-[600px]">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-card/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">航小智 · 智库问答</div>
            <div className="text-[10px] text-text-muted">GLM-4-Flash + RAG · 流式</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-accent-green">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          已连接
        </div>
      </div>

      {/* 对话区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                m.role === "user"
                  ? "bg-bg-elevated border border-border"
                  : "bg-gradient-to-br from-cyan-500 to-blue-600"
              )}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={cn("flex-1 max-w-[80%]", m.role === "user" ? "text-right" : "")}>
              {/* 检索元数据 */}
              {m.meta?.sources && m.meta.sources.length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span className="badge-cyan text-[10px]">意图: {m.meta.intent}</span>
                  {m.meta.sources.map((s, idx) => (
                    <span key={idx} className="badge text-[10px] font-mono bg-bg-elevated text-text-secondary border-border">
                      <FileText className="w-2.5 h-2.5" />
                      {s.source.split("#")[1] || s.source}
                      <span className="text-text-muted">·{(s.score * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              )}
              <div
                className={cn(
                  "inline-block text-left rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-brand-500/20 border border-brand-500/30"
                    : "bg-bg-elevated border border-border"
                )}
              >
                {m.content ? (
                  <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_strong]:text-brand-400 [&_code]:text-accent-cyan [&_code]:bg-bg [&_code]:px-1 [&_code]:rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                ) : loading ? (
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    正在检索 + 生成...
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 输入区 */}
      <div className="border-t border-border p-3 bg-bg-card/50">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="text-[11px] px-2 py-1 rounded-md bg-bg-elevated border border-border text-text-secondary hover:border-brand-500 hover:text-text-primary transition disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            disabled={loading}
            placeholder="输入机务问题,Enter 发送..."
            className="input flex-1"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="btn-primary disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
