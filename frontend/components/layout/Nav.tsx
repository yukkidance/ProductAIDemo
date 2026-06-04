"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "主页" },
  { href: "/products/knowledge", label: "智库机器人" },
  { href: "/products/marketing", label: "营销生成" },
  { href: "/products/analytics", label: "生产分析" },
  { href: "/products/forecast", label: "供应链预测" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center font-bold text-white group-hover:shadow-glow-brand transition-shadow">
            AI
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold gradient-text">AI Engineering Portfolio</div>
            <div className="text-[10px] text-text-muted font-mono">4 products · full-stack</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg transition-colors",
                  active
                    ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition"
        >
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          沈书迪-产品经理-面试演示作品
        </a>
      </div>
    </header>
  );
}
