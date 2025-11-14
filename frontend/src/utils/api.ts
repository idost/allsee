const BASE = process.env.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || "";
export const API_BASE = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;

function buildUrl(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path));
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...(init || {}),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}
