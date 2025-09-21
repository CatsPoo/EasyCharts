import type {
  AuthResponse,
  User,
} from "@easy-charts/easycharts-types";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setAccessToken } from "../api/authStore";
import { http, installAuthFailureHandler } from "../api/http";

interface AuthContextProps {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On app load, try to refresh once to restore session
  useEffect(() => {
    (async () => {
      try {
        const { data } = await http.post<AuthResponse>("/api/auth/refresh");
        setAccessToken(data.token);
        setToken(data.token);
        setUser(data.user ?? null);
      } catch {
        setAccessToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Install a global handler to log out if refresh ultimately fails
  useEffect(() => {
    installAuthFailureHandler(async () => {
      setAccessToken(null);
      setToken(null);
      setUser(null);
      // no await on logout here; backend may be unreachable — rely on cookie expiry
      try {
        await http.post("/api/auth/logout");
      } catch { /* empty */ }
      // Let router redirect via ProtectedRoute guard
    });
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await http.post<AuthResponse>("/api/auth/login", {
      username,
      password,
    });
    setAccessToken(data.token);
    setToken(data.token);
    setUser(data.user ?? null);
    if (!data.user) {
      const { data: profile } = await http.get<{ user: User }>("/api/auth/profile");
      setUser(profile.user);
    }
  };

  const logout = async () => {
    try {
      await http.post("/api/auth/logout");
    } catch {
      /* empty */
    }
    setAccessToken(null);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, accessToken, loading, login, logout }),
    [user, accessToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthInternal() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
