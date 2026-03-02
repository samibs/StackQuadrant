"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface Scan {
  id: string;
  targetKeywords: string[];
  enabledSources: string[];
  status: string;
  timeframeDays: number;
  createdAt: string;
  completedAt: string | null;
}

export default function ScansPage() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    authFetch("/api/v1/scans")
      .then(res => res.json())
      .then(data => setScans(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, authFetch, router]);

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "var(--score-high)";
      case "running": return "var(--accent-primary)";
      case "failed": return "var(--score-low)";
      default: return "var(--text-muted)";
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Your Scans
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            {user?.subscription?.planCode === "free" ? "Free plan" : `${user?.subscription?.planCode} plan`}
          </p>
        </div>
        <Link
          href="/scans/new"
          style={{
            padding: "8px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 600,
            color: "#fff",
            background: "var(--accent-primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
          }}
        >
          + New Scan
        </Link>
      </div>

      {scans.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 12px" }}>
            No scans yet. Create your first scan to discover pain points.
          </p>
          <Link
            href="/scans/new"
            style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-primary)", textDecoration: "none" }}
          >
            Create your first scan →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {scans.map(scan => (
            <Link
              key={scan.id}
              href={`/scans/${scan.id}`}
              style={{
                display: "block",
                padding: "12px 16px",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>
                    {scan.targetKeywords.slice(0, 3).join(", ")}
                    {scan.targetKeywords.length > 3 && ` +${scan.targetKeywords.length - 3}`}
                  </span>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {scan.enabledSources.join(", ")} · {scan.timeframeDays}d · {new Date(scan.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: statusColor(scan.status),
                  textTransform: "uppercase",
                }}>
                  {scan.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
