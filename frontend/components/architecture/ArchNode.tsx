"use client";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

export type NodeKind = "input" | "process" | "service" | "data" | "llm" | "output";

const KIND_STYLES: Record<NodeKind, { bg: string; border: string; text: string; badge: string; icon: string }> = {
  input: {
    bg: "bg-gradient-to-br from-cyan-500/15 to-cyan-600/5",
    border: "border-cyan-500/50",
    text: "text-cyan-300",
    badge: "bg-cyan-500/20 text-cyan-300",
    icon: "📥",
  },
  process: {
    bg: "bg-gradient-to-br from-brand-500/15 to-brand-600/5",
    border: "border-brand-500/50",
    text: "text-brand-300",
    badge: "bg-brand-500/20 text-brand-300",
    icon: "⚙️",
  },
  service: {
    bg: "bg-gradient-to-br from-purple-500/15 to-purple-600/5",
    border: "border-purple-500/50",
    text: "text-purple-300",
    badge: "bg-purple-500/20 text-purple-300",
    icon: "🔧",
  },
  data: {
    bg: "bg-gradient-to-br from-orange-500/15 to-orange-600/5",
    border: "border-orange-500/50",
    text: "text-orange-300",
    badge: "bg-orange-500/20 text-orange-300",
    icon: "💾",
  },
  llm: {
    bg: "bg-gradient-to-br from-pink-500/15 to-pink-600/5",
    border: "border-pink-500/50",
    text: "text-pink-300",
    badge: "bg-pink-500/20 text-pink-300",
    icon: "🧠",
  },
  output: {
    bg: "bg-gradient-to-br from-emerald-500/15 to-emerald-600/5",
    border: "border-emerald-500/50",
    text: "text-emerald-300",
    badge: "bg-emerald-500/20 text-emerald-300",
    icon: "📤",
  },
};

export interface ArchNodeData {
  label: string;
  detail?: string;
  kind: NodeKind;
  tech?: string;
}

export function ArchNode({ data, selected }: NodeProps<ArchNodeData>) {
  const style = KIND_STYLES[data.kind];
  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border-2 px-4 py-3 backdrop-blur",
        style.bg,
        style.border,
        selected && "shadow-glow-brand"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-brand-500 !w-2 !h-2" />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{style.icon}</span>
        <span className={cn("text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded", style.badge)}>
          {data.kind}
        </span>
      </div>
      <div className={cn("text-sm font-semibold", style.text)}>{data.label}</div>
      {data.detail && <div className="text-[11px] text-text-muted mt-1 leading-snug">{data.detail}</div>}
      {data.tech && (
        <div className="text-[10px] font-mono text-text-muted mt-1.5 pt-1.5 border-t border-border">
          {data.tech}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-brand-500 !w-2 !h-2" />
    </div>
  );
}
