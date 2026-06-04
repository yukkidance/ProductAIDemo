import axios from "axios";
import { API_BASE } from "./utils";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

/**
 * 消费 SSE 流(用于 RAG 对话 / 营销生成)
 * 默认 60 秒超时,超时抛 AbortError-friendly 错误
 */
export async function* sseStream(
  url: string,
  body: any,
  timeoutMs: number = 60000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`SSE 请求失败: HTTP ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let lastEventAt = Date.now();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      lastEventAt = Date.now();
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") return;
          try {
            yield JSON.parse(data);
          } catch {
            // skip malformed
          }
        }
      }
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("请求超时(60秒无响应)，请检查后端是否启动或 LLM 调用是否正常");
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}
