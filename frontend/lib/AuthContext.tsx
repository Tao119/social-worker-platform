"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authAPI } from "./api";
import type { User } from "./types";
import { AxiosError } from "axios";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isHospital: boolean;
  isFacility: boolean;
  isAdmin: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser) as User);
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      return {
        success: false,
        error: axiosError.response?.data?.error || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    authAPI.logout().catch(() => {});
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isHospital: user?.role === "hospital",
    isFacility: user?.role === "facility",
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
