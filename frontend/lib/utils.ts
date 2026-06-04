import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_BASE;
  if (!raw) return "http://localhost:8000";
  return `https://${raw.replace(/:\d+$/, "")}`;
})();
