"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface PainPoint {
  id: string;
  title: string;
  summary: string;
  severityScore: number;
  frequencyScore: number;
  intensityScore: number;
  marketSizeScore: number;
  competitionScore: number;
  wtpScore: number;
  trendDirection: string;
  sourceCount: number;
  audienceSummary: string | null;
  competitorNames: string[] | null;
  evidenceCount: number;
  solutionIdeas: Array<{ id: string; title: string; description: string; confidenceScore: number; targetAudience?: string | null }>;
}

interface ScanDetail {
  id: string;
  targetKeywords: string[];
  enabledSources: string[];
  status: string;
  timeframeDays: number;
  createdAt: string;
  completedAt: string | null;
  painPointCount: number;
}

export default function ScanDetailPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [generatingIdeas, setGeneratingIdeas] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    params.then(p => setScanId(p.scanId));
  }, [params]);

  const fetchScan = useCallback(async () => {
    if (!scanId) return;
    try {
      const res = await authFetch(`/api/v1/scans/${scanId}`);
      if (!res.ok) { router.push("/scans"); return; }
      const data = await res.json();
      setScan(data.data.scan);
      setPainPoints(data.data.painPoints || []);
    } catch {
      router.push("/scans");
    } finally {
      setLoading(false);
    }
  }, [scanId, authFetch, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (!user) { router.push("/login"); return; }
    fetchScan();
  }, [user, authLoading, fetchScan, router]);

  const handleGenerateIdeas = useCallback(async (ppId: string) => {
    setGeneratingIdeas(ppId);
    try {
      const res = await authFetch(`/api/v1/pain-points/${ppId}/ideas`, { method: "POST" });
      if (res.ok) await fetchScan();
    } catch { /* handled */ }
    setGeneratingIdeas(null);
  }, [authFetch, fetchScan]);

  const handleExport = useCallback(async (format: "csv" | "json") => {
    if (!scanId) return;
    setExporting(true);
    try {
      const res = await authFetch("/api/v1/exports", {
        method: "POST",
        body: JSON.stringify({ scanId, format }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition") || "";
        const filename = disposition.match(/filename="(.+)"/)?.[1] || `export.${format}`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* handled */ }
    setExporting(false);
  }, [scanId, authFetch]);

  // Auto-refresh for running scans
  useEffect(() => {
    if (scan?.status !== "running" && scan?.status !== "queued") return;
    const interval = setInterval(fetchScan, 5000);
    return () => clearInterval(interval);
  }, [scan?.status, fetchScan]);

  if (authLoading || loading) {
    return <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (!scan) return null;

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "var(--score-high)";
      case "running": return "var(--accent-primary)";
      case "failed": return "var(--score-low)";
      default: return "var(--text-muted)";
    }
  };

  const severityColor = (score: number) => {
    if (score >= 70) return "var(--score-high)";
    if (score >= 40) return "#eab308";
    return "var(--text-muted)";
  };

  const trendIcon = (dir: string) => {
    if (dir === "growing") return "↑";
    if (dir === "declining") return "↓";
    return "→";
  };

  return (
    <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <Link href="/scans" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          ← Back to Scans
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {scan.targetKeywords.join(", ")}
          </h1>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: statusColor(scan.status), textTransform: "uppercase" }}>
            {scan.status === "running" ? "Analyzing..." : scan.status}
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
          {scan.enabledSources.join(", ")} · {scan.timeframeDays}d · {new Date(scan.createdAt).toLocaleDateString()}
          {scan.completedAt && ` · Completed ${new Date(scan.completedAt).toLocaleTimeString()}`}
        </div>
        {scan.status === "completed" && painPoints.length > 0 && (
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              style={{ padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-secondary)", background: "none", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", cursor: exporting ? "not-allowed" : "pointer" }}
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
            <button
              onClick={() => handleExport("json")}
              disabled={exporting}
              style={{ padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-secondary)", background: "none", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", cursor: exporting ? "not-allowed" : "pointer" }}
            >
              Export JSON
            </button>
          </div>
        )}
      </div>

      {/* Running state */}
      {(scan.status === "running" || scan.status === "queued") && (
        <div style={{ padding: "24px", textAlign: "center", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", marginBottom: "16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)" }}>
            {scan.status === "queued" ? "Scan queued, starting soon..." : "Scanning sources and analyzing pain points..."}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "8px" }}>
            Auto-refreshing every 5 seconds
          </div>
        </div>
      )}

      {/* Failed state */}
      {scan.status === "failed" && (
        <div style={{ padding: "16px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.05)", marginBottom: "16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#ef4444" }}>
            Scan failed. Please try again or contact support.
          </div>
        </div>
      )}

      {/* Pain Points */}
      {scan.status === "completed" && painPoints.length === 0 && (
        <div style={{ padding: "24px", textAlign: "center", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)" }}>
            No significant pain points found for these keywords. Try broader keywords or different subreddits.
          </p>
        </div>
      )}

      {painPoints.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
            {painPoints.length} pain point{painPoints.length !== 1 ? "s" : ""} found
          </div>
          {painPoints.map(pp => (
            <div
              key={pp.id}
              style={{
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface)",
                overflow: "hidden",
              }}
            >
              {/* Collapsed header */}
              <button
                onClick={() => setExpanded(expanded === pp.id ? null : pp.id)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>
                    {pp.title}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {pp.sourceCount} source{pp.sourceCount !== 1 ? "s" : ""} · {trendIcon(pp.trendDirection)} {pp.trendDirection}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: severityColor(pp.severityScore) }}>
                      {pp.severityScore}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase" }}>severity</div>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
                    {expanded === pp.id ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === pp.id && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border-default)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", margin: "12px 0" }}>
                    {pp.summary}
                  </p>

                  {/* Score breakdown */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
                    {[
                      { label: "Frequency", value: pp.frequencyScore },
                      { label: "Intensity", value: pp.intensityScore },
                      { label: "Market Size", value: pp.marketSizeScore },
                      { label: "Competition Gap", value: pp.competitionScore },
                      { label: "Willingness to Pay", value: pp.wtpScore },
                      { label: "Evidence", value: pp.evidenceCount, isCount: true },
                    ].map(({ label, value, isCount }) => (
                      <div key={label} style={{ padding: "8px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>
                          {label}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: isCount ? "var(--text-primary)" : severityColor(value) }}>
                          {value}{!isCount && "/100"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Audience */}
                  {pp.audienceSummary && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Target Audience</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>{pp.audienceSummary}</div>
                    </div>
                  )}

                  {/* Competitors */}
                  {pp.competitorNames && pp.competitorNames.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Existing Solutions</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {pp.competitorNames.map(name => (
                          <span key={name} style={{ padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solution Ideas */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Solution Ideas</div>
                      <button
                        onClick={() => handleGenerateIdeas(pp.id)}
                        disabled={generatingIdeas === pp.id}
                        style={{
                          padding: "3px 8px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: "#fff",
                          background: "var(--accent-primary)",
                          border: "none",
                          borderRadius: "var(--radius-sm)",
                          cursor: generatingIdeas === pp.id ? "not-allowed" : "pointer",
                          opacity: generatingIdeas === pp.id ? 0.6 : 1,
                        }}
                      >
                        {generatingIdeas === pp.id ? "Generating..." : pp.solutionIdeas.length > 0 ? "Generate More" : "Generate Ideas"}
                      </button>
                    </div>
                    {pp.solutionIdeas.map(idea => (
                      <div key={idea.id} style={{ padding: "8px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", marginBottom: "4px" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", fontWeight: 600 }}>{idea.title}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{idea.description}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>
                          Confidence: {idea.confidenceScore}% · {idea.targetAudience || ""}
                        </div>
                      </div>
                    ))}
                    {pp.solutionIdeas.length === 0 && (
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", padding: "8px 0" }}>
                        Click &quot;Generate Ideas&quot; to get AI-powered solution suggestions.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
