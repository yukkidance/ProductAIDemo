"use client";
import { useEffect, useState } from "react";
import { Lock, LogIn, Loader2 } from "lucide-react";
import { getAuth, setAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/utils";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authed" | "unauthed" | "verifying">("loading");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setStatus(getAuth() ? "authed" : "unauthed");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !pass) {
      setErr("用户名和密码不能为空");
      return;
    }
    setErr("");
    setStatus("verifying");
    try {
      const b64 = btoa(`${user.trim()}:${pass}`);
      const url = API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Basic ${b64}` },
      });
      if (res.status === 200) {
        setAuth(user.trim(), pass);
        setStatus("authed");
        return;
      }
      if (res.status === 401) {
        setStatus("unauthed");
        setErr("用户名或密码错误");
        return;
      }
      setStatus("unauthed");
      setErr(`后端返回 HTTP ${res.status}`);
    } catch (e: any) {
      setStatus("unauthed");
      setErr("无法连接后端: " + (e?.message || ""));
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-text-muted text-sm">加载中...</div>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          正在验证凭据...
        </div>
      </div>
    );
  }

  if (status === "unauthed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <form onSubmit={submit} className="card w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand-400">
            <Lock className="w-5 h-5" />
            <h1 className="text-lg font-semibold">AI Portfolio · 演示站点</h1>
          </div>
          <p className="text-xs text-text-muted">
            访问需要凭据(部署到 Render 时配置,默认用户名 demo)。
          </p>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="用户名"
            className="input w-full"
            autoFocus
          />
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="密码"
            type="password"
            className="input w-full"
          />
          {err && <div className="text-xs text-red-400">{err}</div>}
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            进入
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
