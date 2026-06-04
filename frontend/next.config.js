/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE
  || (process.env.NODE_ENV === "production"
        ? "productaidemo.onrender.com"
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
