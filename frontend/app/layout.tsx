import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/layout/Nav";

export const metadata: Metadata = {
  title: "AI Engineering Portfolio",
  description: "智库机器人 / 营销生成 / 生产分析 / 供应链预测 4 大 AI 工程作品",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        <main className="relative">{children}</main>
        <footer className="border-t border-border mt-24 py-8 text-center text-xs text-text-muted">
          <div className="max-w-7xl mx-auto px-6">
            Built with Next.js · FastAPI · ChromaDB · XGBoost · GLM-4-Flash · React Flow
          </div>
        </footer>
      </body>
    </html>
  );
}
