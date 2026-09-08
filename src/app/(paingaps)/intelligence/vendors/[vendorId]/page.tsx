"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface VendorPain {
  id: string;
  title: string;
  summary: string;
  intensityScore: number;
  frequencyScore: number;
  trendDirection: string;
  fixDetected: boolean;
  fixDetectedAt: string | null;
  firstSeenAt: string;
  evidenceCount: number;
}

interface VendorDetail {
  id: string;
  vendorName: string;
  vendorAliases: string[];
  sector: string;
  isActive: boolean;
  pains: VendorPain[];
}

interface DoraCategory {
  id: string;
  name: string;
  description: string;
  severityWeight: string;
  displayOrder: number;
}

interface DoraIncident {
  id: string;
  categoryId: string;
  esaReportId: string | null;
  title: string;
  description: string;
  severity: number;
  occurredAt: string;
  resolvedAt: string | null;
  disclosureUrl: string | null;
}

interface EsaReport {
  id: string;
  reportTitle: string;
  reportDate: string;
  sourceUrl: string;
  totalIncidents: number;
}

interface DoraSummary {
  vendorId: string;
  riskScore: number;
  incidentCount: number;
  categoryBreakdown: Record<string, { count: number; weightedScore: number }>;
  incidents: DoraIncident[];
  categories: DoraCategory[];
  latestEsaReport: EsaReport | null;
}

const SEVERITY_LABELS: Record<number, string> = {
  1: "Minor",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Catastrophic",
};

export default function VendorDetailPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [dora, setDora] = useState<DoraSummary | null>(null);
  const [doraLoading, setDoraLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState("");
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    categoryId: "",
    title: "",
    description: "",
    severity: "3",
    occurredAt: "",
    disclosureUrl: "",
  });

  useEffect(() => {
    params.then((p) => setVendorId(p.vendorId));
  }, [params]);

  const loadDora = useCallback(async () => {
    if (!vendorId) return;
    setDoraLoading(true);
    try {
      const res = await authFetch(`/api/v1/finserv/vendors/${vendorId}/dora`);
      const data = await res.json();
      setDora(data.data || null);
    } catch {
      setDora(null);
    } finally {
      setDoraLoading(false);
    }
  }, [authFetch, vendorId]);

  useEffect(() => {
    if (authLoading || !vendorId) return;
    if (!user) { router.push("/login"); return; }

    authFetch(`/api/v1/finserv/vendors/${vendorId}`)
      .then(res => res.json())
      .then(data => setVendor(data.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));

    loadDora();
  }, [user, authLoading, authFetch, router, vendorId, loadDora]);

  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.categoryId || !form.title || !form.description || !form.occurredAt) {
      setFormError("All fields except disclosure URL are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/v1/finserv/vendors/${vendorId}/dora`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId,
          title: form.title,
          description: form.description,
          severity: Number(form.severity),
          occurredAt: new Date(form.occurredAt).toISOString(),
          disclosureUrl: form.disclosureUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error?.message || "Failed to record incident");
        return;
      }
      setForm({ categoryId: "", title: "", description: "", severity: "3", occurredAt: "", disclosureUrl: "" });
      setShowIncidentForm(false);
      await loadDora();
    } catch {
      setFormError("Network error recording incident");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <Link href="/intelligence/vendors" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Back</Link>
        <p style={{ fontSize: "14px", marginTop: 16 }}>Vendor not found.</p>
      </div>
    );
  }

  const trendIcon = (dir: string) => {
    if (dir === "growing") return "↑";
    if (dir === "declining") return "↓";
    return "→";
  };

  const trendColor = (dir: string) => {
    if (dir === "growing") return "#ef4444";
    if (dir === "declining") return "#10b981";
    return "#6b7280";
  };

  const riskColor = (score: number) => {
    if (score >= 70) return "#ef4444";
    if (score >= 40) return "#f59e0b";
    if (score >= 15) return "#fbbf24";
    return "#10b981";
  };

  const riskLabel = (score: number) => {
    if (score >= 70) return "CRITICAL";
    if (score >= 40) return "ELEVATED";
    if (score >= 15) return "MODERATE";
    return "LOW";
  };

  const categoryName = (id: string) =>
    dora?.categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <Link href="/intelligence/vendors" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Vendor Pain Map</Link>

      <div style={{ marginTop: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: 4 }}>{vendor.vendorName}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{vendor.sector}</span>
          {vendor.vendorAliases.length > 0 && (
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Also: {vendor.vendorAliases.join(", ")}</span>
          )}
        </div>
      </div>

      {/* DORA Risk Score */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
            DORA INCIDENT RISK
          </h2>
          <Link
            href="/intelligence/dora"
            style={{ fontSize: "10px", color: "var(--text-muted)", textDecoration: "none" }}
          >
            View ESA taxonomy →
          </Link>
        </div>

        {doraLoading ? (
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Computing risk score...</div>
        ) : dora ? (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{
                fontSize: "32px",
                fontWeight: 700,
                color: riskColor(dora.riskScore),
                minWidth: 80,
              }}>
                {dora.riskScore.toFixed(1)}
              </div>
              <div>
                <div style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  color: riskColor(dora.riskScore),
                }}>
                  {riskLabel(dora.riskScore)} RISK
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 2 }}>
                  Severity-weighted score across {dora.incidentCount} disclosed incident{dora.incidentCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            {dora.latestEsaReport && (
              <div style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                paddingTop: 12,
                borderTop: "1px solid var(--border)",
                marginBottom: 12,
              }}>
                Baseline: <a
                  href={dora.latestEsaReport.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {dora.latestEsaReport.reportTitle}
                </a>{" "}
                · {new Date(dora.latestEsaReport.reportDate).toLocaleDateString()}
              </div>
            )}

            {Object.keys(dora.categoryBreakdown).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(dora.categoryBreakdown).map(([catId, b]) => (
                  <span key={catId} style={{
                    fontSize: "10px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: 3,
                    padding: "3px 8px",
                  }}>
                    {categoryName(catId)}: <strong>{b.count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No DORA data available.</div>
        )}

        {/* Incident list */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
              DISCLOSED INCIDENTS ({dora?.incidents.length ?? 0})
            </h3>
            <button
              onClick={() => setShowIncidentForm((v) => !v)}
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                padding: "3px 8px",
                borderRadius: 3,
                cursor: "pointer",
              }}
            >
              {showIncidentForm ? "Cancel" : "+ Record incident"}
            </button>
          </div>

          {showIncidentForm && dora && (
            <form
              onSubmit={submitIncident}
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 14,
                marginBottom: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  style={{ flex: 1, fontSize: "12px", fontFamily: "var(--font-mono)", padding: 6, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  <option value="">Category…</option>
                  {dora.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  style={{ width: 130, fontSize: "12px", fontFamily: "var(--font-mono)", padding: 6, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} – {SEVERITY_LABELS[n]}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Incident title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ fontSize: "12px", fontFamily: "var(--font-mono)", padding: 6, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                style={{ fontSize: "12px", fontFamily: "var(--font-mono)", padding: 6, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="datetime-local"
                  value={form.occurredAt}
                  onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
                  style={{ flex: 1, fontSize: "12px", fontFamily: "var(--font-mono)", padding: 6, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
                <input
                  type="url"
                  placeholder="Disclosure URL (optional)"
                  value={form.disclosureUrl}
                  onChange={(e) => setForm({ ...form, disclosureUrl: e.target.value })}
                  style={{ flex: 1, fontSize: "12px", fontFamily: "var(--font-mono)", padding: 6, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              {formError && <div style={{ fontSize: "11px", color: "#ef4444" }}>{formError}</div>}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  background: "var(--text-primary)",
                  color: "var(--bg-primary)",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 3,
                  cursor: submitting ? "wait" : "pointer",
                  alignSelf: "flex-start",
                }}
              >
                {submitting ? "Recording..." : "Record incident"}
              </button>
            </form>
          )}

          {dora && dora.incidents.length === 0 ? (
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 16, fontSize: "11px", color: "var(--text-muted)" }}>
              No DORA incidents recorded. Add disclosed incidents to compute a regulatory risk score.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dora?.incidents.map((inc) => (
                <div key={inc.id} style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      padding: "2px 6px",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                      borderRadius: 3,
                      color: "var(--text-secondary)",
                    }}>
                      {categoryName(inc.categoryId).toUpperCase()}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>{inc.title}</span>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: inc.severity >= 4 ? "#ef4444" : inc.severity >= 3 ? "#f59e0b" : "var(--text-muted)",
                    }}>
                      SEV {inc.severity} · {SEVERITY_LABELS[inc.severity]}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: 6 }}>
                    {inc.description}
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: "10px", color: "var(--text-muted)" }}>
                    <span>Occurred: {new Date(inc.occurredAt).toLocaleDateString()}</span>
                    {inc.resolvedAt && (
                      <span>Resolved: {new Date(inc.resolvedAt).toLocaleDateString()}</span>
                    )}
                    {inc.disclosureUrl && (
                      <a
                        href={inc.disclosureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Source ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pain Rankings */}
      <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>
        PAIN RANKINGS ({vendor.pains.length})
      </h2>

      {vendor.pains.length === 0 ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)" }}>
          No pain signals detected yet. Signals are collected from Reddit, review sites, and industry sources.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {vendor.pains.map((pain, idx) => (
            <div key={pain.id} style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", minWidth: 24 }}>#{idx + 1}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>{pain.title}</span>
                {pain.fixDetected && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                    background: "#10b981", color: "white",
                  }}>FIX DETECTED</span>
                )}
                <span style={{ fontSize: "11px", fontWeight: 700, color: trendColor(pain.trendDirection) }}>
                  {trendIcon(pain.trendDirection)} {pain.trendDirection}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: 8 }}>{pain.summary}</div>
              <div style={{ display: "flex", gap: 16, fontSize: "10px", color: "var(--text-muted)" }}>
                <span>Intensity: <strong style={{ color: pain.intensityScore > 70 ? "#ef4444" : "inherit" }}>{pain.intensityScore}</strong></span>
                <span>Frequency: <strong>{pain.frequencyScore}</strong></span>
                <span>Evidence: {pain.evidenceCount} signals</span>
                <span>First seen: {new Date(pain.firstSeenAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
