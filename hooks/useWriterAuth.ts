"use client";
import { useEffect, useState, useCallback } from "react";

export function useWriterAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("writer_token");
    setToken(stored);
    setLoaded(true);
  }, []);

  const login = useCallback((newToken: string) => {
    localStorage.setItem("writer_token", newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("writer_token");
    setToken(null);
  }, []);

  return { token, login, logout, loaded };
}
