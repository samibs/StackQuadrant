"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface Regulation {
  id: string;
  name: string;
  shortCode: string;
  issuingBody: string;
  jurisdictions: string[];
  effectiveDate: string | null;
  implementationDeadline: string | null;
  status: string;
  summary: string;
  painScore: number | null;
}

export default function RegulationsPage() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBody, setFilterBody] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    const params = new URLSearchParams();
    if (filterBody) params.set("issuingBody", filterBody);
    if (filterStatus) params.set("status", filterStatus);

    authFetch(`/api/v1/finserv/regulations?${params.toString()}`)
      .then(res => res.json())
      .then(data => setRegulations(data.data?.regulations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, authFetch, router, filterBody, filterStatus]);

  const bodies = ["CSSF", "FCA", "SEC", "FINMA", "ESMA", "EBA", "EIOPA", "OECD", "FATF"];
  const statuses = ["proposed", "consultation", "adopted", "effective", "superseded"];

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      proposed: "#6b7280", consultation: "#f59e0b", adopted: "#3b82f6", effective: "#10b981", superseded: "#9ca3af",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Link href="/intelligence" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Intelligence</Link>
          <h1 style={{ fontSize: "20px", fontWeight: 700, marginTop: 4 }}>Regulatory Radar</h1>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filterBody} onChange={(e) => { setFilterBody(e.target.value); setLoading(true); }} style={{
          fontFamily: "var(--font-mono)", fontSize: "11px", padding: "4px 8px",
          background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit",
        }}>
          <option value="">All Bodies</option>
          {bodies.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setLoading(true); }} style={{
          fontFamily: "var(--font-mono)", fontSize: "11px", padding: "4px 8px",
          background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit",
        }}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Loading regulations...</div>
      ) : regulations.length === 0 ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)" }}>
          No regulations found. Regulatory data is ingested automatically from regulatory body RSS feeds.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {regulations.map((reg) => (
            <Link key={reg.id} href={`/intelligence/regulations/${reg.id}`} style={{
              display: "block", background: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: 6, padding: 14, textDecoration: "none", color: "inherit",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{
                  fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                  background: statusColor(reg.status), color: "white", textTransform: "uppercase",
                }}>{reg.status}</span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>{reg.shortCode}</span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{reg.issuingBody}</span>
                {reg.painScore !== null && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 3, marginLeft: "auto",
                    background: reg.painScore > 70 ? "#ef4444" : reg.painScore > 40 ? "#f59e0b" : "#10b981",
                    color: "white",
                  }}>Pain: {reg.painScore}</span>
                )}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: 4 }}>{reg.name}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4 }}>{reg.summary.slice(0, 200)}{reg.summary.length > 200 ? "..." : ""}</div>
              <div style={{ display: "flex", gap: 12, fontSize: "10px", color: "var(--text-muted)" }}>
                <span>Jurisdictions: {reg.jurisdictions.join(", ")}</span>
                {reg.implementationDeadline && <span>Deadline: {reg.implementationDeadline}</span>}
                {reg.effectiveDate && <span>Effective: {reg.effectiveDate}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
