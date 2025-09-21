import axios from "axios";
import {
  beginRefresh,
  getAccessToken,
  setAccessToken,
  setOnAuthFailure,
} from "./authStore";
import type { AuthRefreshResponse } from "@easy-charts/easycharts-types";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // send refresh httpOnly cookie
});

// Inject access token
http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → try refresh once → retry original → else logout
let hasInstalledFailureHandler = false;

export function installAuthFailureHandler(logoutFn: () => void) {
  if (!hasInstalledFailureHandler) {
    setOnAuthFailure(logoutFn);
    hasInstalledFailureHandler = true;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original || original.__isRetry) throw error;

    // Only attempt refresh on 401/403 from protected routes
    const status: number | undefined = error?.response?.status;
    if (status === 401 || status === 403) {
      const newToken = await beginRefresh(async () => {
        const { data } = await http.post<AuthRefreshResponse>("/auth/refresh");
        setAccessToken(data.token);
        return data.token;
      });
      original.__isRetry = true;
      original.headers = original.headers ?? {};
      original.headers["Authorization"] = `Bearer ${newToken}`;
      return http(original);
    }
    throw error
  }
);
