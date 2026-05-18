import { createContext, useContext, useState, ReactNode } from "react";
import { AuthUser, getUser, setAuth, clearAuth } from "../lib/auth";
import { login as apiLogin } from "../api/authApi";

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getUser);

  async function login(email: string, password: string) {
    const data = await apiLogin(email, password);
    setAuth(data.access_token, data.user);
    setUser(data.user);
  }

  function logout() {
    clearAuth();
    setUser(null);
  }

  // Quick role toggle for demo — swaps between artist@kamik.ru and admin@kamik.ru
  async function switchRole() {
    if (!user) return;
    const nextEmail = user.role === "artist" ? "admin@kamik.ru" : "artist@kamik.ru";
    const pass = user.role === "artist" ? "admin123" : "artist123";
    await login(nextEmail, pass);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
