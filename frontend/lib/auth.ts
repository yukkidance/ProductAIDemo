const STORAGE_KEY = "ai_auth";

export function getAuth(): { user: string; pass: string } | null {
  if (typeof window === "undefined") return null;
  const b64 = localStorage.getItem(STORAGE_KEY);
  if (!b64) return null;
  try {
    const decoded = atob(b64);
    const i = decoded.indexOf(":");
    if (i < 0) return null;
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

export function getAuthHeader(): Record<string, string> {
  const a = getAuth();
  if (!a) return {};
  return { Authorization: `Basic ${btoa(`${a.user}:${a.pass}`)}` };
}

export function setAuth(user: string, pass: string) {
  localStorage.setItem(STORAGE_KEY, btoa(`${user}:${pass}`));
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
