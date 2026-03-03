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
  sourceUrl: string;
  impactMap: Record<string, number> | null;
  painScore: number | null;
}

export default function RegulationDetailPage({ params }: { params: Promise<{ regId: string }> }) {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [reg, setReg] = useState<Regulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [regId, setRegId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setRegId(p.regId));
  }, [params]);

  useEffect(() => {
    if (authLoading || !regId) return;
    if (!user) { router.push("/login"); return; }

    authFetch(`/api/v1/finserv/regulations/${regId}`)
      .then(res => res.json())
      .then(data => setReg(data.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, authFetch, router, regId]);

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  if (!reg) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <Link href="/intelligence/regulations" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Back</Link>
        <p style={{ fontSize: "14px", marginTop: 16 }}>Regulation not found.</p>
      </div>
    );
  }

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      proposed: "#6b7280", consultation: "#f59e0b", adopted: "#3b82f6", effective: "#10b981", superseded: "#9ca3af",
    };
    return colors[status] || "#6b7280";
  };

  const impactEntries = reg.impactMap ? Object.entries(reg.impactMap).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <Link href="/intelligence/regulations" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Regulatory Radar</Link>

      <div style={{ marginTop: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 3,
            background: statusColor(reg.status), color: "white", textTransform: "uppercase",
          }}>{reg.status}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>{reg.shortCode}</span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{reg.issuingBody}</span>
        </div>
        <h1 style={{ fontSize: "20px", fontWeight: 700 }}>{reg.name}</h1>
      </div>

      {/* Key Details */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 4 }}>JURISDICTIONS</div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{reg.jurisdictions.join(", ")}</div>
        </div>
        {reg.effectiveDate && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 4 }}>EFFECTIVE DATE</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{reg.effectiveDate}</div>
          </div>
        )}
        {reg.implementationDeadline && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 4 }}>DEADLINE</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{reg.implementationDeadline}</div>
          </div>
        )}
        {reg.painScore !== null && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 4 }}>PAIN SCORE</div>
            <div style={{
              fontSize: "20px", fontWeight: 700,
              color: reg.painScore > 70 ? "#ef4444" : reg.painScore > 40 ? "#f59e0b" : "#10b981",
            }}>{reg.painScore}</div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 8 }}>SUMMARY</div>
        <div style={{ fontSize: "13px", lineHeight: 1.6 }}>{reg.summary}</div>
      </div>

      {/* Impact Map */}
      {impactEntries.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>DEPARTMENT IMPACT</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {impactEntries.map(([dept, score]) => (
              <div key={dept} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "12px", width: 120 }}>{dept}</span>
                <div style={{ flex: 1, height: 8, background: "var(--bg-secondary)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${score}%`, borderRadius: 4,
                    background: score > 70 ? "#ef4444" : score > 40 ? "#f59e0b" : "#10b981",
                  }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, width: 30, textAlign: "right" }}>{score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source */}
      <a href={reg.sourceUrl} target="_blank" rel="noopener noreferrer" style={{
        display: "inline-block", fontSize: "11px", color: "var(--accent)", textDecoration: "none",
      }}>View Official Publication →</a>
    </div>
  );
}
