"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Brain, Target, Layers, Wrench } from "lucide-react";
import { PRODUCTS, ProductId } from "@/lib/products";
import { cn } from "@/lib/utils";

interface ProductPageLayoutProps {
  id: ProductId;
  children?: React.ReactNode;
  architecture: React.ReactNode;     // 架构图(可交互)
  demo: React.ReactNode;             // 演示区
  highlights: { title: string; desc: string }[];
}

export default function ProductPageLayout({
  id,
  children,
  architecture,
  demo,
  highlights,
}: ProductPageLayoutProps) {
  const p = PRODUCTS.find((x) => x.id === id)!;
  return (
    <div className="grid-bg min-h-screen">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回主页
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br text-2xl",
                  p.color
                )}
              >
                {p.id === "knowledge" ? "🤖" : p.id === "marketing" ? "✍️" : p.id === "analytics" ? "📊" : "📈"}
              </div>
              <div>
                <div className="text-xs font-mono text-brand-400">{p.en}</div>
                <h1 className="text-3xl md:text-4xl font-bold">{p.name}</h1>
              </div>
            </div>
            <p className="text-text-secondary max-w-2xl leading-relaxed">{p.desc}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.stack.map((s) => (
              <span key={s} className="badge-brand font-mono text-xs">
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 痛点 + 指标 */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <div className="card md:col-span-2">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-mono mb-2">
            <Target className="w-3.5 h-3.5" />
            PAIN POINT
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">{p.pain}</p>
        </div>
        {p.metrics.map((m) => (
          <div key={m.label} className="card">
            <div className="text-xs text-text-muted mb-1">{m.label}</div>
            <div className="text-2xl font-bold gradient-text">{m.value}</div>
          </div>
        ))}
      </section>

      {/* 选型架构图 */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <SectionTitle icon={Layers} title="选型架构图" sub="点击节点查看说明 · 支持拖拽缩放" />
        <div className="card p-0 overflow-hidden h-[500px]">{architecture}</div>
      </section>

      {/* 实时演示 */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <SectionTitle icon={Brain} title="实时演示" sub="真实调用,后端流式返回" />
        {demo}
      </section>

      {/* 亮点 */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <SectionTitle icon={Wrench} title="工程亮点" sub="根据企业实际场景选型" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="text-brand-400 text-xs font-mono mb-1">0{i + 1}</div>
              <div className="font-semibold mb-2">{h.title}</div>
              <p className="text-sm text-text-secondary leading-relaxed">{h.desc}</p>
            </motion.div>
          ))}
        </div>
        {children && <div className="mt-8">{children}</div>}
      </section>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-brand-400" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <div className="text-xs text-text-muted">{sub}</div>
    </div>
  );
}
