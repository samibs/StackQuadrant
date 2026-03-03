"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface PracticePain {
  id: string;
  title: string;
  summary: string;
  category: string;
  intensityScore: number;
  frequencyScore: number;
  trendDirection: string;
  evidenceCount: number;
  vendorName: string;
}

interface Opportunity {
  id: string;
  title: string;
  summary: string;
  intensityScore: number;
  opportunityScore: number;
  demandIndicator: string;
  vendorName: string;
  sector: string;
}

interface TalentPain {
  id: string;
  title: string;
  summary: string;
  intensityScore: number;
  trendDirection: string;
  talentCategory: string;
  vendorName: string;
}

export default function PracticeIntelligencePage() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [pains, setPains] = useState<PracticePain[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [talentPains, setTalentPains] = useState<TalentPain[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pains" | "opportunities" | "talent">("pains");

  const loadData = useCallback(async () => {
    try {
      const [dashRes, opRes, talentRes] = await Promise.all([
        authFetch("/api/v1/finserv/practice/dashboard"),
        authFetch("/api/v1/finserv/practice/opportunities"),
        authFetch("/api/v1/finserv/practice/talent"),
      ]);

      if (dashRes.ok) { const d = await dashRes.json(); setPains(d.data?.pains || []); }
      if (opRes.ok) { const d = await opRes.json(); setOpportunities(d.data?.opportunities || []); }
      if (talentRes.ok) { const d = await talentRes.json(); setTalentPains(d.data?.talentPains || []); }
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
  const categoryLabel = (cat: string) => ({ operational: "Operational", technology: "Technology", talent: "Talent", regulatory: "Regulatory", client: "Client" }[cat] || cat);

  if (authLoading || loading) {
    return <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <Link href="/intelligence" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Intelligence</Link>
      <h1 style={{ fontSize: "20px", fontWeight: 700, marginTop: 4, marginBottom: 20 }}>Practice Intelligence</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {(["pains", "opportunities", "talent"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 14px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            background: tab === t ? "var(--accent)" : "var(--bg-secondary)", color: tab === t ? "white" : "var(--text-secondary)",
            border: tab === t ? "none" : "1px solid var(--border)", borderRadius: 4,
          }}>{t === "pains" ? "Practice Pains" : t === "opportunities" ? "Service Opportunities" : "Talent Signals"}</button>
        ))}
      </div>

      {/* Practice Pains Tab */}
      {tab === "pains" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pains.length === 0 ? (
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)" }}>
              No practice pains detected yet. Track audit/accounting vendors to start collecting signals.
            </div>
          ) : pains.map((pain, idx) => (
            <div key={pain.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)" }}>#{idx + 1}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, flex: 1 }}>{pain.title}</span>
                <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: 3, background: "var(--bg)", border: "1px solid var(--border)" }}>{categoryLabel(pain.category)}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: trendColor(pain.trendDirection) }}>{trendIcon(pain.trendDirection)}</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{pain.vendorName} · Intensity: {pain.intensityScore} · Evidence: {pain.evidenceCount}</div>
            </div>
          ))}
        </div>
      )}

      {/* Opportunities Tab */}
      {tab === "opportunities" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opportunities.length === 0 ? (
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)" }}>
              No service opportunities detected yet.
            </div>
          ) : opportunities.map((op) => (
            <div key={op.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                  background: op.demandIndicator === "high" ? "#ef4444" : op.demandIndicator === "moderate" ? "#f59e0b" : "#6b7280", color: "white",
                }}>{op.demandIndicator} demand</span>
                <span style={{ fontSize: "12px", fontWeight: 600, flex: 1 }}>{op.title}</span>
                <span style={{ fontSize: "11px", fontWeight: 700 }}>Score: {op.opportunityScore}</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: 4 }}>{op.summary.slice(0, 150)}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{op.vendorName} · {op.sector}</div>
            </div>
          ))}
        </div>
      )}

      {/* Talent Tab */}
      {tab === "talent" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {talentPains.length === 0 ? (
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)" }}>
              No talent signals detected yet.
            </div>
          ) : talentPains.map((tp) => (
            <div key={tp.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: 3, background: "var(--bg)", border: "1px solid var(--border)" }}>{tp.talentCategory}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, flex: 1 }}>{tp.title}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: trendColor(tp.trendDirection) }}>{trendIcon(tp.trendDirection)}</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Intensity: {tp.intensityScore} · {tp.vendorName}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
