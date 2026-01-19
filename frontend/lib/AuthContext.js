"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "./api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    authAPI.logout().catch(() => {});
  };

  const value = {
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
