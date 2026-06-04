import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_BASE;
  if (!raw) return "http://localhost:8000";
  // 本地开发环境:raw 为 "localhost:8000",补 http://
  if (raw.startsWith("localhost")) return `http://${raw}`;
  // 已是完整 URL(含 http:// 或 https://),直接使用
  if (raw.includes("://")) return raw;
  // 其他情况(裸域名)补 https://
  return `https://${raw.replace(/:\d+$/, "")}`;
})();
