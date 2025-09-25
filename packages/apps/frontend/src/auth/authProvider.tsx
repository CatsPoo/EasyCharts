// AuthProvider.tsx
import axios from "axios";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createHttp, setupHttpAuth } from "../api/http";
import type {User, AuthResponse } from "@easy-charts/easycharts-types";

type AuthContextType = {
  isAuthenticated: boolean;
  accessToken: string | null;
  user:User|null,
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_ACCESS = "access_token";
const LS_REFRESH = "refresh_token";

const authHttp = axios.create({ baseURL: "/api" }); // bare client for login/refresh

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(LS_ACCESS));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(LS_REFRESH));
  const [user,setUser] = useState<User|null>(null)
  const isAuthenticated = !!accessToken;

  useEffect(() => {
    createHttp("/api");
    setupHttpAuth({
      getAccessToken: () => accessToken,
      getRefreshToken: () => refreshToken,
      performRefresh: async (rt) => {
        const res = await authHttp.post<AuthResponse>("/auth/refresh", rt);
        if (res.status !== 200 || !res.data?.token)
          throw new Error("Refresh failed");
        return res.data;
      },
      setTokens: (at, rt) => {
        setAccessToken(at);
        if (at) localStorage.setItem(LS_ACCESS, at);
        else localStorage.removeItem(LS_ACCESS);

        if (rt !== undefined) {
          setRefreshToken(rt ?? null);
          if (rt) localStorage.setItem(LS_REFRESH, rt);
          else localStorage.removeItem(LS_REFRESH);
        }
      },
      handleLogout: () => {
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem(LS_ACCESS);
        localStorage.removeItem(LS_REFRESH);
      },
    });
  }, [accessToken, refreshToken]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authHttp.post<AuthResponse>("/auth/login", { username, password });
    if (!res.data?.token || !res.data?.refreshToken) throw new Error("Login failed");
    const { token: at, refreshToken: rt,user } = res.data;
    localStorage.setItem(LS_ACCESS, at);
    localStorage.setItem(LS_REFRESH, rt);
    setAccessToken(at);
    setRefreshToken(rt);
    setUser(user)
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null)
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
  }, []);

  const value = useMemo(() => ({ isAuthenticated, accessToken, login, logout,user }), [isAuthenticated, accessToken, login, logout,user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
