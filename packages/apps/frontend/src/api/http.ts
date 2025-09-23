// http.ts
import type { AuthResponse } from "@easy-charts/easycharts-types";
import axios, { AxiosError, type AxiosInstance } from "axios";

let http: AxiosInstance;

// callbacks provided by AuthProvider
let getAccessToken: () => string | null;
let getRefreshToken: () => string | null;
let performRefresh: (refreshToken: string) => Promise<AuthResponse>;
let setTokens: (at: string, rt?: string | null) => void;
let handleLogout: () => void;

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

export function createHttp(baseURL = "/api") {
  if (http) return http;

  http = axios.create({ baseURL });

  // attach Authorization header
  http.interceptors.request.use((config) => {
    const token = getAccessToken?.();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
    (config.headers as Record<string, string>)["Accept"] = "application/json";
    return config;
  });

  // auto-refresh on 401
  http.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as any;
      if (error.response?.status !== 401 || original?._retry) {
        return Promise.reject(error);
      }
      original._retry = true;

      const rt = getRefreshToken?.();
      if (!rt || !performRefresh) {
        handleLogout?.();
        return Promise.reject(error);
      }

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = (async () => {
            const data = await performRefresh(rt);
            setTokens?.(data.token, data.refreshToken ?? null);
          })().finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return http!(original); // retry with new token
      } catch (e) {
        return Promise.reject(e);
      }
    }
  );

  return http;
}

export function setupHttpAuth(opts: {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  performRefresh: (refreshToken: string) => Promise<RefreshReturn>;
  setTokens: (at: string, rt?: string | null) => void;
  handleLogout: () => void;
}) {
  getAccessToken = opts.getAccessToken;
  getRefreshToken = opts.getRefreshToken;
  performRefresh = opts.performRefresh;
  setTokens = opts.setTokens;
  handleLogout = opts.handleLogout;
}

export { http };
