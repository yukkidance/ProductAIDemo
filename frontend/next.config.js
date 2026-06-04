/** @type {import('next').NextConfig} */
// NEXT_PUBLIC_API_BASE 优先，无变量时生产环境使用 Render 后端域名
// 部署后请在 Render Dashboard 设置 NEXT_PUBLIC_API_BASE 环境变量
const API_BASE = process.env.NEXT_PUBLIC_API_BASE
  || (process.env.NODE_ENV === "production"
        ? "ai-portfolio-backend.onrender.com"  // ← 替换为你的实际后端域名
        : "localhost:8000");

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  env: {
    NEXT_PUBLIC_API_BASE: API_BASE,
  },
};
module.exports = nextConfig;
