"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface FundOpsPainIndex {
  area: string;
  areaName: string;
  painCount: number;
  avgIntensity: number;
  topPain: { title: string; intensityScore: number; trendDirection: string } | null;
  trend: string;
}

export default function FundOpsPage() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [index, setIndex] = useState<FundOpsPainIndex[]>([]);
  const [totalPains, setTotalPains] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await authFetch("/api/v1/finserv/fund-ops/index");
      if (res.ok) {
        const data = await res.json();
        setIndex(data.data?.index || []);
        setTotalPains(data.data?.totalPains || 0);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadData();
  }, [user, authLoading, router, loadData]);

  const trendIcon = (dir: string) => dir === "growing" ? "↑" : dir === "declining" ? "↓" : "→";
  const trendColor = (dir: string) => dir === "growing" ? "#ef4444" : dir === "declining" ? "#10b981" : "#6b7280";
  const intensityColor = (score: number) => score > 70 ? "#ef4444" : score > 40 ? "#f59e0b" : "#10b981";

  if (authLoading || loading) {
    return <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <Link href="/intelligence" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Intelligence</Link>
      <h1 style={{ fontSize: "20px", fontWeight: 700, marginTop: 4, marginBottom: 8 }}>Fund Operations Intelligence</h1>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: 24 }}>
        Operational pain index across fund industry areas · {totalPains} total signals
      </p>

      {/* Pain Index Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {index.map((area) => (
          <div key={area.area} style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{area.areaName}</div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: trendColor(area.trend) }}>
                {trendIcon(area.trend)} {area.trend}
              </span>
            </div>

            {/* Intensity Bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginBottom: 4 }}>
                <span>Avg Intensity</span>
                <span style={{ fontWeight: 700, color: intensityColor(area.avgIntensity) }}>{area.avgIntensity}</span>
              </div>
              <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${area.avgIntensity}%`, borderRadius: 3,
                  background: intensityColor(area.avgIntensity),
                }} />
              </div>
            </div>

            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 6 }}>
              {area.painCount} pain signals detected
            </div>

            {area.topPain && (
              <div style={{
                background: "var(--bg)", borderRadius: 4, padding: "6px 10px",
                fontSize: "11px", color: "var(--text-secondary)",
              }}>
                <span style={{ fontWeight: 600 }}>Top:</span> {area.topPain.title}
                <span style={{ color: trendColor(area.topPain.trendDirection), marginLeft: 4 }}>
                  {trendIcon(area.topPain.trendDirection)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {index.every((a) => a.painCount === 0) && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)", marginTop: 20 }}>
          No fund operations pain signals detected yet. Track fund industry vendors to start collecting operational pain data.
        </div>
      )}
    </div>
  );
}
