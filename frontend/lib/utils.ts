import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_BASE;
  if (!raw) return "http://localhost:8000";
  // 本地开发环境直接使用 http
  if (raw.startsWith("localhost")) return `http://${raw}`;
  return `https://${raw.replace(/:\d+$/, "")}`;
})();
