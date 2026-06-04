"use client";
import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { ArchNode } from "./ArchNode";
import { FLOWS, FlowKey } from "./flows";

const nodeTypes = { arch: ArchNode };

export default function ProductArchitecture({ flow }: { flow: FlowKey }) {
  const { nodes, edges } = useMemo(() => FLOWS[flow].build(), [flow]);
  return (
    <ReactFlow
      nodes={nodes as Node[]}
      edges={edges as Edge[]}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
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
  );
}
