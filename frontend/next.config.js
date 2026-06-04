/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  env: {
    NEXT_PUBLIC_API_BASE: "productaidemo.onrender.com",
  },
};
module.exports = nextConfig;
