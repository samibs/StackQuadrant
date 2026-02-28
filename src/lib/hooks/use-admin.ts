"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useAdmin() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sq-admin-token");
    const expires = localStorage.getItem("sq-admin-expires");

    if (!stored || !expires || new Date(expires) < new Date()) {
      localStorage.removeItem("sq-admin-token");
      localStorage.removeItem("sq-admin-expires");
      router.push("/admin/login");
      return;
    }

    setToken(stored);
    setLoading(false);
  }, [router]);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (res.status === 401) {
      localStorage.removeItem("sq-admin-token");
      localStorage.removeItem("sq-admin-expires");
      router.push("/admin/login");
      throw new Error("Session expired");
    }
    return res;
  }, [token, router]);

  const logout = useCallback(() => {
    localStorage.removeItem("sq-admin-token");
    localStorage.removeItem("sq-admin-expires");
    router.push("/admin/login");
  }, [router]);

  return { token, loading, authFetch, logout };
}
