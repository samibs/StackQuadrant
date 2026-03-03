"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";

const SOURCES = [
  { id: "reddit", name: "Reddit", description: "Subreddit posts and comments" },
];

const TIMEFRAMES = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

export default function NewScanPage() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [keywords, setKeywords] = useState("");
  const [subreddits, setSubreddits] = useState("");
  const [enabledSources, setEnabledSources] = useState<string[]>(["reddit"]);
  const [timeframeDays, setTimeframeDays] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const targetKeywords = keywords.split(",").map(k => k.trim()).filter(Boolean);
    const targetSubreddits = subreddits.split(",").map(s => s.trim().replace(/^r\//, "")).filter(Boolean);

    if (targetKeywords.length === 0) {
      setError("Enter at least one keyword");
      setLoading(false);
      return;
    }

    try {
      const res = await authFetch("/api/v1/scans", {
        method: "POST",
        body: JSON.stringify({
          targetKeywords,
          targetSubreddits: targetSubreddits.length > 0 ? targetSubreddits : undefined,
          enabledSources,
          timeframeDays,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to create scan");
        return;
      }

      router.push(`/scans/${data.data.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    fontWeight: 600 as const,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "4px",
  };

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 16px" }}>
      <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
        New Scan
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "24px" }}>
        Define your market research parameters
      </p>

      {error && (
        <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", color: "#ef4444", fontFamily: "var(--font-mono)", fontSize: "12px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={labelStyle}>Keywords (comma-separated)</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            required
            style={inputStyle}
            placeholder="e.g. project management, team collaboration, task tracking"
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
            Up to {user.subscription?.planCode === "pro" ? 25 : user.subscription?.planCode === "starter" ? 10 : 3} keywords
          </span>
        </div>

        <div>
          <label style={labelStyle}>Subreddits (optional, comma-separated)</label>
          <input
            type="text"
            value={subreddits}
            onChange={(e) => setSubreddits(e.target.value)}
            style={inputStyle}
            placeholder="e.g. r/SaaS, r/startups, r/Entrepreneur"
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
            Leave empty to search all of Reddit
          </span>
        </div>

        <div>
          <label style={labelStyle}>Data Sources</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SOURCES.map(source => (
              <label
                key={source.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  border: `1px solid ${enabledSources.includes(source.id) ? "var(--accent-primary)" : "var(--border-default)"}`,
                  borderRadius: "var(--radius-sm)",
                  background: enabledSources.includes(source.id) ? "rgba(22,163,74,0.1)" : "var(--bg-surface)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                }}
              >
                <input
                  type="checkbox"
                  checked={enabledSources.includes(source.id)}
                  onChange={(e) => {
                    if (e.target.checked) setEnabledSources([...enabledSources, source.id]);
                    else setEnabledSources(enabledSources.filter(s => s !== source.id));
                  }}
                  style={{ display: "none" }}
                />
                {source.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Timeframe</label>
          <select
            value={timeframeDays}
            onChange={(e) => setTimeframeDays(Number(e.target.value))}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {TIMEFRAMES.map(tf => (
              <option key={tf.value} value={tf.value}>{tf.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 600,
            color: "#fff",
            background: "var(--accent-primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Creating scan..." : "Start Scan"}
        </button>
      </form>
    </div>
  );
}
