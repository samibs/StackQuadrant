"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface DoraCategory {
  id: string;
  name: string;
  description: string;
  severityWeight: string;
  displayOrder: number;
}

interface EsaReport {
  id: string;
  reportTitle: string;
  reportDate: string;
  reportPeriodStart: string | null;
  reportPeriodEnd: string | null;
  sourceUrl: string;
  summary: string;
  categoryDistribution: Record<string, number>;
  totalIncidents: number;
}

export default function DoraTaxonomyPage() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [categories, setCategories] = useState<DoraCategory[]>([]);
  const [reports, setReports] = useState<EsaReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    Promise.all([
      authFetch("/api/v1/finserv/dora/categories").then((r) => r.json()),
      authFetch("/api/v1/finserv/dora/reports").then((r) => r.json()),
    ])
      .then(([catRes, repRes]) => {
        setCategories(catRes.data?.categories || []);
        setReports(repRes.data?.reports || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, authFetch, router]);

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <Link href="/intelligence/vendors" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Vendor Pain Map</Link>

      <h1 style={{ fontSize: "20px", fontWeight: 700, marginTop: 12, marginBottom: 6 }}>
        DORA Incident Taxonomy
      </h1>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.5 }}>
        ICT incident categories aligned with Regulation (EU) 2022/2554 (DORA) and the ESA joint reporting framework.
        Each category carries a severity weight used in the vendor risk score.
      </p>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
          ESA REPORTS ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 16, fontSize: "11px", color: "var(--text-muted)" }}>
            No ESA reports recorded yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reports.map((r) => (
              <div key={r.id} style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 14,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <a
                    href={r.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}
                  >
                    {r.reportTitle} ↗
                  </a>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {new Date(r.reportDate).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.5 }}>
                  {r.summary}
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: "10px", color: "var(--text-muted)" }}>
                  <span>Total incidents: <strong>{r.totalIncidents}</strong></span>
                  {r.reportPeriodStart && r.reportPeriodEnd && (
                    <span>
                      Period: {new Date(r.reportPeriodStart).toLocaleDateString()} → {new Date(r.reportPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {Object.keys(r.categoryDistribution).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {Object.entries(r.categoryDistribution).map(([catId, count]) => {
                      const cat = categories.find((c) => c.id === catId);
                      return (
                        <span key={catId} style={{
                          fontSize: "10px",
                          background: "var(--bg-primary)",
                          border: "1px solid var(--border)",
                          borderRadius: 3,
                          padding: "3px 8px",
                        }}>
                          {cat?.name ?? catId}: <strong>{count}</strong>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
          INCIDENT CATEGORIES ({categories.length})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {categories.map((c) => (
            <div key={c.id} style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>{c.name}</span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: Number(c.severityWeight) >= 0.95 ? "#ef4444" : Number(c.severityWeight) >= 0.85 ? "#f59e0b" : "var(--text-muted)",
                }}>
                  WEIGHT {Number(c.severityWeight).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {c.description}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
