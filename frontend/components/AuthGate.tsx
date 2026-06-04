"use client";
import { useEffect, useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { getAuth, setAuth } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authed" | "unauthed">("loading");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setStatus(getAuth() ? "authed" : "unauthed");
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !pass) {
      setErr("用户名和密码不能为空");
      return;
    }
    setAuth(user.trim(), pass);
    setStatus("authed");
    setErr("");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-text-muted text-sm">加载中...</div>
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
