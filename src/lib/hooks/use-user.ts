"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  subscription: {
    planCode: string;
    status: string;
    currentPeriodEnd: string | null;
  };
}

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      let res = await fetch("/api/v1/users/me", { credentials: "include" });

      // If access token expired, try refresh
      if (res.status === 401) {
        const refreshRes = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok) {
          res = await fetch("/api/v1/users/me", { credentials: "include" });
        }
      }

      if (!res.ok) throw new Error("Not authenticated");

      const data = await res.json();
      setUser(data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    let res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });

    // Auto-refresh on 401
    if (res.status === 401) {
      const refreshRes = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) {
        res = await fetch(url, {
          ...options,
          credentials: "include",
          headers: { "Content-Type": "application/json", ...options.headers },
        });
      } else {
        router.push("/login");
        throw new Error("Session expired");
      }
    }

    return res;
  }, [router]);

  const logout = useCallback(async () => {
    await fetch("/api/v1/auth/user-logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, loading, authenticated: !!user, authFetch, logout, refresh: checkAuth };
}
