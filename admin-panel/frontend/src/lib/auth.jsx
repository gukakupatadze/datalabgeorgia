import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "@/lib/api";

const AuthContext = createContext(null);
const SESSION_USER_KEY = "crm_session_user";

function cachedUser() {
  try {
    return JSON.parse(window.sessionStorage.getItem(SESSION_USER_KEY)) || null;
  } catch {
    return null;
  }
}

function rememberUser(user) {
  if (user) window.sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  else window.sessionStorage.removeItem(SESSION_USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const current = await authApi.me();
      setUser(current);
      rememberUser(current);
      return current;
    } catch (error) {
      if (error?.response?.status === 401) {
        setUser(null);
        rememberUser(null);
        return null;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // A short backend/network interruption during a hard refresh must not
    // erase the already authenticated tab. A real 401 is still handled above.
    refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    const clearSession = () => {
      setUser(null);
      rememberUser(null);
    };
    window.addEventListener("crm:unauthorized", clearSession);
    return () => window.removeEventListener("crm:unauthorized", clearSession);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      rememberUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser, logout }),
    [user, loading, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
