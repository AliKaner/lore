"use client";
import { useEffect, useState, useCallback } from "react";

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin_token");
    setToken(stored);
    setLoaded(true);
  }, []);

  const login = useCallback((newToken: string) => {
    localStorage.setItem("admin_token", newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    setToken(null);
  }, []);

  return { token, login, logout, loaded };
}
