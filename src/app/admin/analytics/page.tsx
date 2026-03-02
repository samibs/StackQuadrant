"use client";

import { useAdmin } from "@/lib/hooks/use-admin";
import { useState, useEffect, useCallback } from "react";

interface SuggestionAnalytics {
  byType: Array<{ type: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  total: number;
  communityVerified: number;
  overTime: Array<{ date: string; count: number }>;
}

interface ReportAnalytics {
  byType: Array<{ type: string; count: number }>;
  total: number;
  overTime: Array<{ date: string; count: number }>;
}

interface QuestionData {
  questions: Array<{ normalizedQuery: string; count: number }>;
  engagement: {
    askQueries: number;
    suggestions: number;
    reports: number;
    avgReviewTimeHours: number;
  };
}

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  approved: "#22c55e",
  rejected: "#ef4444",
  needs_info: "#0ea5e9",
};

const TYPE_LABELS: Record<string, string> = {
  add_tool: "Add Tool",
  move_tool: "Move Tool",
  update_metadata: "Update",
  merge_duplicates: "Merge",
  flag_discontinued: "Discontinue",
  bug: "Bug",
  data_quality: "Data Quality",
};

export default function AdminAnalyticsPage() {
  const { loading: authLoading, authFetch } = useAdmin();
  const [period, setPeriod] = useState("30d");
  const [siteFilter, setSiteFilter] = useState("");
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [suggestionData, setSuggestionData] = useState<SuggestionAnalytics | null>(null);
  const [reportData, setReportData] = useState<ReportAnalytics | null>(null);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(3);
  const [thresholdInput, setThresholdInput] = useState("3");
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [autoApprove, setAutoApprove] = useState({ enabled: false, threshold: 90, minSubmissions: 10 });
  const [autoApproveInput, setAutoApproveInput] = useState({ threshold: "90", minSubmissions: "10" });
  const [savingAutoApprove, setSavingAutoApprove] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    authFetch("/api/v1/admin/sites").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setSiteOptions((data.data || []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      }
    }).catch(() => {});
  }, [authLoading, authFetch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const siteParam = siteFilter ? `&site=${siteFilter}` : "";
      const [sugRes, repRes, qRes, thRes, aaRes] = await Promise.all([
        authFetch(`/api/v1/admin/analytics/suggestions?period=${period}${siteParam}`),
        authFetch(`/api/v1/admin/analytics/reports?period=${period}${siteParam}`),
        authFetch(`/api/v1/admin/analytics/questions?period=${period}${siteParam}`),
        authFetch(`/api/v1/admin/settings/verification-threshold`),
        authFetch(`/api/v1/admin/settings/auto-approve`),
      ]);

      if (sugRes.ok) { const d = await sugRes.json(); setSuggestionData(d.data); }
      if (repRes.ok) { const d = await repRes.json(); setReportData(d.data); }
      if (qRes.ok) { const d = await qRes.json(); setQuestionData(d.data); }
      if (thRes.ok) { const d = await thRes.json(); setThreshold(d.data.threshold); setThresholdInput(String(d.data.threshold)); }
      if (aaRes.ok) {
        const d = await aaRes.json();
        setAutoApprove(d.data);
        setAutoApproveInput({ threshold: String(d.data.threshold), minSubmissions: String(d.data.minSubmissions) });
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
    setLoading(false);
  }, [authFetch, period, siteFilter]);

  useEffect(() => { if (!authLoading) fetchData(); }, [authLoading, fetchData]);

  const handleThresholdSave = async () => {
    const val = parseInt(thresholdInput, 10);
    if (isNaN(val) || val < 2 || val > 20) return;
    setSavingThreshold(true);
    try {
      const res = await authFetch("/api/v1/admin/settings/verification-threshold", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold: val }),
      });
      if (res.ok) setThreshold(val);
    } catch { /* ignore */ }
    setSavingThreshold(false);
  };

  const handleAutoApproveSave = async (updates: Record<string, unknown>) => {
    setSavingAutoApprove(true);
    try {
      const res = await authFetch("/api/v1/admin/settings/auto-approve", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const d = await res.json();
        setAutoApprove(d.data);
        setAutoApproveInput({ threshold: String(d.data.threshold), minSubmissions: String(d.data.minSubmissions) });
      }
    } catch { /* ignore */ }
    setSavingAutoApprove(false);
  };

  if (authLoading) return null;

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "var(--space-1)" }}>
            ADMIN / WIDGET ANALYTICS
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            Widget Analytics
          </h1>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          {siteOptions.length > 1 && (
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={{
                padding: "var(--space-1) var(--space-3)",
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
            >
              <option value="">All Sites</option>
              {siteOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              style={{
                padding: "var(--space-1) var(--space-3)",
                background: period === opt.value ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: period === opt.value ? "#fff" : "var(--text-muted)",
                border: "1px solid " + (period === opt.value ? "var(--accent-primary)" : "var(--border-default)"),
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-muted)", fontSize: 12 }}>
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Engagement Stats */}
          {questionData?.engagement && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
              <StatCard label="Ask Queries" value={questionData.engagement.askQueries} />
              <StatCard label="Suggestions" value={questionData.engagement.suggestions} />
              <StatCard label="Reports" value={questionData.engagement.reports} />
              <StatCard label="Avg Review Time" value={`${questionData.engagement.avgReviewTimeHours}h`} />
            </div>
          )}

          {/* Suggestion Analytics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            {/* By Status */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Suggestions by Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {suggestionData?.byStatus.map((item) => (
                  <div key={item.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[item.status] || "var(--text-muted)" }} />
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "capitalize" }}>{item.status.replace("_", " ")}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{item.count}</span>
                  </div>
                ))}
                {suggestionData && (
                  <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "var(--space-2)", marginTop: "var(--space-1)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Community Verified</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--score-high)", fontFamily: "var(--font-mono)" }}>{suggestionData.communityVerified}</span>
                  </div>
                )}
              </div>
            </div>

            {/* By Type */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Suggestions by Type</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {suggestionData?.byType.map((item) => {
                  const maxCount = Math.max(...(suggestionData?.byType.map(i => i.count) || [1]));
                  return (
                    <div key={item.type}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{TYPE_LABELS[item.type] || item.type}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{item.count}</span>
                      </div>
                      <div style={{ height: 4, background: "var(--bg-input)", borderRadius: 2 }}>
                        <div style={{ height: 4, background: "var(--accent-primary)", borderRadius: 2, width: `${(item.count / maxCount) * 100}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reports Analytics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Reports by Type</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {reportData?.byType.map((item) => (
                  <div key={item.type} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{TYPE_LABELS[item.type] || item.type}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{item.count}</span>
                  </div>
                ))}
                {(!reportData?.byType || reportData.byType.length === 0) && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No reports in this period</span>
                )}
              </div>
            </div>

            {/* Suggestion volume over time */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Suggestions Over Time</h3>
              {suggestionData?.overTime && suggestionData.overTime.length > 0 ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
                  {suggestionData.overTime.map((item) => {
                    const maxCount = Math.max(...suggestionData.overTime.map(i => i.count));
                    return (
                      <div
                        key={item.date}
                        title={`${item.date}: ${item.count}`}
                        style={{
                          flex: 1,
                          height: `${Math.max((item.count / (maxCount || 1)) * 100, 4)}%`,
                          background: "var(--accent-primary)",
                          borderRadius: "2px 2px 0 0",
                          minWidth: 3,
                          opacity: 0.8,
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No data in this period</span>
              )}
            </div>
          </div>

          {/* Top Questions */}
          <div style={{ ...cardStyle, marginBottom: "var(--space-6)" }}>
            <h3 style={cardTitleStyle}>Top Asked Questions</h3>
            {questionData?.questions && questionData.questions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {questionData.questions.slice(0, 10).map((q, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "var(--space-3)" }}>
                      {q.normalizedQuery}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                      {q.count}x
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No questions asked in this period</span>
            )}
          </div>

          {/* Correction Hotspots - tools with most suggestions */}
          {suggestionData?.byType && suggestionData.byType.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: "var(--space-6)" }}>
              <h3 style={cardTitleStyle}>Approval Rate</h3>
              {(() => {
                const approved = suggestionData.byStatus.find(s => s.status === "approved")?.count || 0;
                const rejected = suggestionData.byStatus.find(s => s.status === "rejected")?.count || 0;
                const total = approved + rejected;
                const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
                return (
                  <div className="flex items-center gap-[var(--space-4)]">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Approved vs Rejected</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: rate >= 50 ? "#22c55e" : "#ef4444", fontFamily: "var(--font-mono)" }}>{rate}%</span>
                      </div>
                      <div style={{ height: 8, background: "var(--bg-input)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                        <div style={{ height: 8, background: "#22c55e", width: `${rate}%`, transition: "width 0.3s" }} />
                        <div style={{ height: 8, background: "#ef4444", flex: 1 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: "#22c55e" }}>{approved} approved</span>
                        <span style={{ fontSize: 10, color: "#ef4444" }}>{rejected} rejected</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Settings */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Community Verification Settings</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Verification threshold (independent suggestions needed):
              </label>
              <input
                type="number"
                min={2}
                max={20}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                style={{
                  width: 60,
                  padding: "var(--space-1) var(--space-2)",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  textAlign: "center",
                }}
              />
              <button
                onClick={handleThresholdSave}
                disabled={savingThreshold || thresholdInput === String(threshold)}
                style={{
                  padding: "var(--space-1) var(--space-3)",
                  background: thresholdInput !== String(threshold) ? "var(--accent-primary)" : "var(--bg-elevated)",
                  color: thresholdInput !== String(threshold) ? "#fff" : "var(--text-muted)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: savingThreshold || thresholdInput === String(threshold) ? "not-allowed" : "pointer",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {savingThreshold ? "Saving..." : "Save"}
              </button>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Current: {threshold}
              </span>
            </div>
          </div>

          {/* Auto-Approve Settings */}
          <div style={{ ...cardStyle, marginTop: "var(--space-4)" }}>
            <h3 style={cardTitleStyle}>Auto-Approve Settings</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Enabled:</label>
                <button
                  onClick={() => handleAutoApproveSave({ enabled: !autoApprove.enabled })}
                  disabled={savingAutoApprove}
                  style={{
                    padding: "var(--space-1) var(--space-3)",
                    background: autoApprove.enabled ? "rgba(34,197,94,0.15)" : "var(--bg-elevated)",
                    color: autoApprove.enabled ? "#22c55e" : "var(--text-muted)",
                    border: "1px solid " + (autoApprove.enabled ? "rgba(34,197,94,0.3)" : "var(--border-default)"),
                    borderRadius: "var(--radius-sm)",
                    cursor: savingAutoApprove ? "not-allowed" : "pointer",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                  }}
                >
                  {autoApprove.enabled ? "ON" : "OFF"}
                </button>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  Only for add_tool and update_metadata types
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Reputation threshold (%):</label>
                <input
                  type="number" min={50} max={100}
                  value={autoApproveInput.threshold}
                  onChange={(e) => setAutoApproveInput(prev => ({ ...prev, threshold: e.target.value }))}
                  style={{ width: 60, padding: "var(--space-1) var(--space-2)", background: "var(--bg-input)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-mono)", textAlign: "center" }}
                />
                <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Min submissions:</label>
                <input
                  type="number" min={3} max={50}
                  value={autoApproveInput.minSubmissions}
                  onChange={(e) => setAutoApproveInput(prev => ({ ...prev, minSubmissions: e.target.value }))}
                  style={{ width: 60, padding: "var(--space-1) var(--space-2)", background: "var(--bg-input)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-mono)", textAlign: "center" }}
                />
                <button
                  onClick={() => handleAutoApproveSave({
                    threshold: parseInt(autoApproveInput.threshold, 10),
                    minSubmissions: parseInt(autoApproveInput.minSubmissions, 10),
                  })}
                  disabled={savingAutoApprove || (autoApproveInput.threshold === String(autoApprove.threshold) && autoApproveInput.minSubmissions === String(autoApprove.minSubmissions))}
                  style={{
                    padding: "var(--space-1) var(--space-3)",
                    background: (autoApproveInput.threshold !== String(autoApprove.threshold) || autoApproveInput.minSubmissions !== String(autoApprove.minSubmissions)) ? "var(--accent-primary)" : "var(--bg-elevated)",
                    color: (autoApproveInput.threshold !== String(autoApprove.threshold) || autoApproveInput.minSubmissions !== String(autoApprove.minSubmissions)) ? "#fff" : "var(--text-muted)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: savingAutoApprove ? "not-allowed" : "pointer",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {savingAutoApprove ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{
      padding: "var(--space-4)",
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
    }}>
      <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)", marginBottom: "var(--space-1)" }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
        {value}
      </p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: "var(--space-4)",
  background: "var(--bg-surface)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  marginBottom: "var(--space-3)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
