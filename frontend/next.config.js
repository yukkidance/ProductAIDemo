/** @type {import('next').NextConfig} */
// API 地址解析策略:
//  1) 优先用 NEXT_PUBLIC_API_BASE(必须是完整 URL,含协议)
//  2) 否则在生产用后端绝对 URL(前后端不同域名)
//  3) 开发用 localhost:8000
//
// 注意:NEXT_PUBLIC_* 在 Next.js 中是 build-time inlined,Render Docker build
// 阶段读不到环境变量。所以这里用「build 时硬编码 + 可选 env 覆盖」方案。
// 真正决定生产行为的是第 2 行的常量,环境变量是可选的 override。
// 如果以后后端域名变更,改第 2 行后 commit 即可生效。
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE
  || (process.env.NODE_ENV === "production"
        ? "https://productaidemo.onrender.com"  // 后端 Render 域名(完整 URL)
        : "http://localhost:8000");

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  env: {
    NEXT_PUBLIC_API_BASE: BACKEND_URL,
  },
};
module.exports = nextConfig;
