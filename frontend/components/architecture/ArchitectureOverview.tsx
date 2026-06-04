"use client";
import { useState, useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/lib/utils";
import { ArchNode } from "./ArchNode";
import { FLOWS, FlowKey } from "./flows";

const nodeTypes = { arch: ArchNode };
const FLOW_KEYS = Object.keys(FLOWS) as FlowKey[];

export default function ArchitectureOverview() {
  const [active, setActive] = useState<FlowKey>("knowledge");
  const { nodes, edges } = useMemo(() => FLOWS[active].build(), [active]);

  return (
    <div className="h-full flex flex-col">
      {/* Tab 切换 */}
      <div className="flex items-center gap-1 p-3 border-b border-border bg-bg-card/50">
        {FLOW_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition",
              active === k
                ? "bg-gradient-brand text-white shadow-glow-brand"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            )}
          >
            {FLOWS[k].name}
          </button>
        ))}
        <div className="ml-auto text-[10px] font-mono text-text-muted">
          {nodes.length} nodes · {edges.length} edges
        </div>
      </div>

      {/* 架构图画布 */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes as Node[]}
          edges={edges as Edge[]}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1f2937" gap={20} size={1} />
          <Controls position="bottom-right" />
          <MiniMap
            position="bottom-left"
            nodeColor={(n) => {
              const kind = (n.data as any)?.kind;
              return (
                { input: "#22d3ee", process: "#6366f1", service: "#8b5cf6", data: "#f59e0b", llm: "#ec4899", output: "#10b981" } as any
              )[kind] || "#6b7280";
            }}
            maskColor="rgba(10,14,26,0.8)"
            style={{ background: "#0a0e1a", border: "1px solid #1f2937" }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
