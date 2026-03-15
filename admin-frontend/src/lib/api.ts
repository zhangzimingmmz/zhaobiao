import { getAdminToken } from "./auth";
import type { ApiResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth !== false) {
    const token = getAdminToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (payload.code !== 200 || payload.data === undefined) {
    throw new Error(payload.message ?? "请求失败");
  }
  return payload.data;
}

export const apiBase = API_BASE;
