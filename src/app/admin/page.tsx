"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useEffect, useState } from "react";

interface DashboardStats {
  tools: number;
  quadrants: number;
  benchmarks: number;
  stacks: number;
}

export default function AdminDashboardPage() {
  const { loading, authFetch, logout } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>({ tools: 0, quadrants: 0, benchmarks: 0, stacks: 0 });

  useEffect(() => {
    if (loading) return;

    async function fetchStats() {
      try {
        const [toolsRes, quadrantsRes, benchmarksRes, stacksRes] = await Promise.all([
          authFetch("/api/v1/admin/tools"),
          authFetch("/api/v1/admin/quadrants"),
          authFetch("/api/v1/admin/benchmarks"),
          authFetch("/api/v1/admin/stacks"),
        ]);

        const [toolsData, quadrantsData, benchmarksData, stacksData] = await Promise.all([
          toolsRes.json(),
          quadrantsRes.json(),
          benchmarksRes.json(),
          stacksRes.json(),
        ]);

        setStats({
          tools: toolsData.data?.length || 0,
          quadrants: quadrantsData.data?.length || 0,
          benchmarks: benchmarksData.data?.length || 0,
          stacks: stacksData.data?.length || 0,
        });
      } catch {}
    }

    fetchStats();
  }, [loading, authFetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>Loading...</span>
      </div>
    );
  }

  const sections = [
    { label: "Tools", count: stats.tools, href: "/admin/tools", description: "Manage AI coding tools and their scores" },
    { label: "Quadrants", count: stats.quadrants, href: "/admin/quadrants", description: "Configure magic quadrant views" },
    { label: "Benchmarks", count: stats.benchmarks, href: "/admin/benchmarks", description: "Manage benchmarks and results" },
    { label: "Stacks", count: stats.stacks, href: "/admin/stacks", description: "Curate tool stack recommendations" },
    { label: "Suggestions", count: null, href: "/admin/suggestions", description: "Review community suggestions" },
    { label: "Reports", count: null, href: "/admin/reports", description: "Triage bug reports and data quality issues" },
    { label: "Analytics", count: null, href: "/admin/analytics", description: "Widget usage, question trends, engagement stats" },
  ];

  return (
    <div style={{ padding: "var(--grid-gap)", maxWidth: "900px", margin: "0 auto" }}>
      <div
        className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <div className="flex items-center gap-[var(--space-2)]">
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-primary)" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.08em" }}>
            ADMIN DASHBOARD
          </span>
        </div>
        <button
          onClick={logout}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
            background: "none",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "4px 12px",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--grid-gap)" }}>
        {sections.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="no-underline"
            style={{
              display: "block",
              padding: "var(--space-4)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </span>
              {s.count !== null && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--accent-primary)" }}>
                  {s.count}
                </span>
              )}
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
              {s.description}
            </p>
          </Link>
        ))}
      </div>

      <div
        className="mt-[var(--grid-gap)] px-[var(--space-4)] py-[var(--space-3)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
          Quick Actions
        </span>
        <div className="flex gap-[var(--space-2)] mt-[var(--space-2)]">
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "4px 12px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              textDecoration: "none",
            }}
          >
            View Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}
