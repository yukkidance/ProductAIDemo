"use client";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Database, Brain, LineChart, Sparkles, Zap, Bot, Pen, BarChart3, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ArchitectureOverview = dynamic(() => import("@/components/architecture/ArchitectureOverview"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center text-text-muted">
      <Brain className="w-8 h-8 animate-pulse" />
    </div>
  ),
});

const iconMap: Record<string, any> = { Bot, Pen, BarChart3, TrendingUp };

export default function Home() {
  return (
    <div className="grid-bg">
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/5 text-brand-400 text-xs font-mono mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI Engineering Portfolio · 4 Production-Ready Products
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            从<span className="gradient-text">痛点</span>到<span className="gradient-text">模型</span>
            <br />
            的端到端 AI 工程实践
          </h1>
          <p className="text-text-secondary text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            围绕机务维修、营销、生产、供应链四大真实业务场景,
            <br className="hidden md:block" />
            以 RAG · Prompt 工程 · NL2SQL · XGBoost 为核心技术,完成从选型到落地的完整闭环。
          </p>
        </motion.div>

        {/* 核心数字 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { v: "4", l: "AI 产品", icon: Cpu },
            { v: "200+", l: "手册文档", icon: Database },
            { v: "85%+", l: "任务准确率", icon: Brain },
            { v: "< 3s", l: "平均响应", icon: Zap },
          ].map((s) => (
            <div key={s.l} className="card text-left">
              <s.icon className="w-5 h-5 text-brand-400 mb-2" />
              <div className="text-3xl font-bold gradient-text">{s.v}</div>
              <div className="text-xs text-text-muted mt-1">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* 产品卡片 */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">四大 AI 产品</h2>
            <p className="text-text-secondary text-sm">点击进入查看架构图与实时演示</p>
          </div>
          <div className="text-xs font-mono text-text-muted">PRODUCTS · 04</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PRODUCTS.map((p, i) => {
            const Icon = iconMap[p.icon];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
              >
                <Link
                  href={`/products/${p.id}`}
                  className={cn(
                    "group block card relative overflow-hidden h-full",
                    "hover:border-brand-500/60 hover:-translate-y-1 transition-all duration-300"
                  )}
                >
                  <div
                    className={cn(
                      "absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20 blur-3xl bg-gradient-to-br",
                      p.color
                    )}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                          p.color
                        )}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">0{i + 1} / 04</span>
                    </div>
                    <div className="text-xs text-brand-400 font-mono mb-1">{p.en}</div>
                    <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-3">
                      {p.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.stack.map((s) => (
                        <span key={s} className="badge-brand">
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex gap-4 text-xs">
                        {p.metrics.slice(0, 2).map((m) => (
                          <div key={m.label}>
                            <div className="text-text-muted">{m.label}</div>
                            <div className="text-text-primary font-semibold">{m.value}</div>
                          </div>
                        ))}
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-400 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 架构图总览 */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              选型<span className="gradient-text">架构图</span>总览
            </h2>
            <p className="text-text-secondary text-sm">Tab 切换 4 个产品 · 鼠标可拖拽 / 缩放 / 悬停查看说明</p>
          </div>
          <div className="text-xs font-mono text-text-muted">ARCHITECTURE · 04</div>
        </div>
        <div className="card p-0 overflow-hidden h-[700px]">
          <ArchitectureOverview />
        </div>
      </section>
    </div>
  );
}
