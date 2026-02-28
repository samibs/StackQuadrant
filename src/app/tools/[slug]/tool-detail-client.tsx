"use client";

import { useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/layout/panel";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { ScoreBar } from "@/components/visualizations/score-bar";
import { RadarChart } from "@/components/visualizations/radar-chart";
import { ScoreLegend } from "@/components/ui/tooltip";

interface ToolDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string | null;
  category: string;
  vendor: string | null;
  overallScore: number | null;
  pricingModel: string | null;
  pricingTier: string | null;
  license: string | null;
  githubUrl: string | null;
  documentationUrl: string | null;
  githubStars: number | null;
  communitySize: string | null;
  tags: string[] | null;
  updatedAt: string | Date | null;
  scores: Array<{
    dimension: string;
    dimensionSlug: string;
    dimensionDescription: string | null;
    dimensionWeight: number | null;
    score: number | null;
    evidence: string | null;
  }>;
  benchmarkResults: Array<{ benchmarkId: string; benchmarkTitle: string; results: Record<string, number>; runDate: Date }>;
  stackAppearances: Array<{ stackId: string; stackName: string; stackSlug: string; role: string; stackScore: number | null }>;
}

interface ScoreHistoryEntry {
  id: string;
  dimensionName: string;
  oldScore: string;
  newScore: string;
  changeReason: string | null;
  changedBy: string;
  changedAt: Date;
}

interface OverallTrendEntry {
  id: string;
  oldScore: string;
  newScore: string;
  changedAt: Date;
}

export function ToolDetailClient({ tool, scoreHistory, overallTrend }: { tool: ToolDetail; scoreHistory: ScoreHistoryEntry[]; overallTrend: OverallTrendEntry[] }) {
  const validScores = tool.scores.filter((s) => s.score !== null).map((s) => ({
    dimension: s.dimension,
    score: s.score!,
    description: s.dimensionDescription,
  }));

  const tags = (tool.tags || []) as string[];

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      {/* Header */}
      <div
        className="tool-detail-header flex items-start justify-between px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-[var(--space-2)] flex-wrap">
            <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
              {tool.name}
            </h1>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
            >
              {tool.category}
            </span>
            {tool.pricingModel && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: tool.pricingModel === "free" ? "rgba(22,163,74,0.15)" : tool.pricingModel === "freemium" ? "rgba(59,130,246,0.15)" : "rgba(234,179,8,0.15)",
                  color: tool.pricingModel === "free" ? "var(--score-high)" : tool.pricingModel === "freemium" ? "#3b82f6" : "var(--score-mid)",
                }}
              >
                {tool.pricingModel}
              </span>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>
            {tool.description}
          </p>
          <div className="flex items-center gap-[var(--space-4)] mt-[var(--space-2)] flex-wrap">
            {tool.vendor && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                {tool.vendor}
              </span>
            )}
            {tool.websiteUrl && (
              <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                Website
              </a>
            )}
            {tool.documentationUrl && (
              <a href={tool.documentationUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                Docs
              </a>
            )}
            {tool.githubUrl && (
              <a href={tool.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                GitHub {tool.githubStars ? `(${(tool.githubStars / 1000).toFixed(1)}K)` : ""}
              </a>
            )}
            <Link href={`/compare?tools=${tool.slug}`} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>
              Compare &rarr;
            </Link>
            {tool.updatedAt && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                Last evaluated: {new Date(tool.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="relative" style={{ width: "72px", height: "72px", flexShrink: 0 }}>
          <ScoreRing
            score={tool.overallScore || 0}
            size={72}
            strokeWidth={5}
            label="/10"
            tooltip="Weighted average across all evaluation dimensions. Scores are based on benchmark testing, expert review, and community feedback."
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="tool-detail-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--grid-gap)" }}>
        {/* Left column */}
        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          {/* Radar Chart */}
          <Panel title="Capability Profile">
            <div className="flex justify-center">
              <RadarChart scores={validScores} size={280} />
            </div>
          </Panel>

          {/* Score Trend */}
          {overallTrend.length > 0 && (
            <Panel title="Score Trend">
              <OverallSparkline trend={overallTrend} currentScore={tool.overallScore} />
            </Panel>
          )}

          {/* Score History Timeline */}
          {scoreHistory.length > 0 && (
            <Panel title="Score Changes">
              <div className="flex flex-col gap-[var(--space-2)]" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {scoreHistory.slice(0, 20).map((entry) => {
                  const oldVal = parseFloat(entry.oldScore);
                  const newVal = parseFloat(entry.newScore);
                  const delta = newVal - oldVal;
                  const isUp = delta > 0;
                  return (
                    <div
                      key={entry.id}
                      style={{
                        padding: "var(--space-2)",
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-sm)",
                        borderLeft: `3px solid ${isUp ? "var(--score-high)" : "var(--score-low)"}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {entry.dimensionName}
                        </span>
                        <span style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: isUp ? "var(--score-high)" : "var(--score-low)",
                        }}>
                          {oldVal.toFixed(1)} → {newVal.toFixed(1)} {isUp ? "▲" : "▼"}{Math.abs(delta).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between" style={{ marginTop: "2px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                          {new Date(entry.changedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {entry.changeReason && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-secondary)", maxWidth: "60%", textAlign: "right" }}>
                            {entry.changeReason}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* Pricing & Licensing */}
          {(tool.pricingTier || tool.license) && (
            <Panel title="Pricing & Licensing">
              {tool.pricingTier && (
                <div style={{ marginBottom: "var(--space-2)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    Pricing
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.6 }}>
                    {tool.pricingTier}
                  </div>
                </div>
              )}
              {tool.license && (
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    License
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)" }}>
                    {tool.license}
                  </div>
                </div>
              )}
            </Panel>
          )}

          {/* Community */}
          {(tool.communitySize || tool.githubStars) && (
            <Panel title="Community">
              <div className="flex gap-[var(--space-4)]">
                {tool.communitySize && (
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Developers</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{tool.communitySize}</div>
                  </div>
                )}
                {tool.githubStars && (
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>GitHub Stars</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{tool.githubStars.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* Benchmark Participations */}
          {tool.benchmarkResults.length > 0 && (
            <Panel title="Benchmark Results">
              <div className="flex flex-col gap-[var(--space-3)]">
                {tool.benchmarkResults.map((br) => (
                  <div key={br.benchmarkId} style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {br.benchmarkTitle}
                    </div>
                    <div className="flex flex-wrap gap-[var(--space-3)] mt-[var(--space-2)]">
                      {Object.entries(br.results).map(([key, value]) => (
                        <div key={key} style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                          <span style={{ color: "var(--text-muted)" }}>{key}: </span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          {/* Tags */}
          {tags.length > 0 && (
            <Panel title="Features">
              <div className="flex flex-wrap gap-[var(--space-1)]">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/matrix?tag=${encodeURIComponent(tag)}`}
                    style={{
                      fontFamily: "var(--font-mono)", fontSize: "10px",
                      padding: "3px 8px", background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-sm)", color: "var(--text-secondary)",
                      textDecoration: "none",
                    }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          {/* Dimension Scores */}
          <Panel
            title="Dimension Scores"
            actions={
              <div className="flex items-center gap-[var(--space-3)]">
                <ScoreLegend />
                <Link href="/methodology" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-primary)" }}>
                  How we score &rarr;
                </Link>
              </div>
            }
          >
            <div className="flex flex-col gap-[var(--space-2)]">
              {tool.scores.map((s) => (
                s.score !== null && (
                  <ScoreBar
                    key={s.dimensionSlug}
                    score={s.score}
                    label={s.dimension}
                    tooltip={s.dimensionDescription ? (
                      <span>
                        {s.dimensionDescription}
                        {s.dimensionWeight && (
                          <span style={{ display: "block", marginTop: 4, color: "var(--text-muted)" }}>
                            Weight: {(s.dimensionWeight * 100).toFixed(0)}%
                          </span>
                        )}
                      </span>
                    ) : undefined}
                    evidence={s.evidence}
                  />
                )
              ))}
            </div>
          </Panel>

          {/* Stack Appearances */}
          {tool.stackAppearances.length > 0 && (
            <Panel title="Stack Appearances">
              <div className="flex flex-col gap-[var(--space-2)]">
                {tool.stackAppearances.map((sa) => (
                  <Link
                    key={sa.stackId}
                    href={`/stacks/${sa.stackSlug}`}
                    className="no-underline p-[var(--space-2)] transition-colors duration-150"
                    style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {sa.stackName}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: (sa.stackScore || 0) >= 8 ? "var(--score-high)" : "var(--score-mid)",
                      }}>
                        {sa.stackScore?.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Role: {sa.role}
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          {/* Subscribe touchpoint */}
          <Panel title="Stay Updated">
            <ToolSubscribeForm toolName={tool.name} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function OverallSparkline({ trend, currentScore }: { trend: OverallTrendEntry[]; currentScore: number | null }) {
  // Build data points: each entry has newScore (the score it changed TO)
  const points = trend.map((t) => ({
    score: parseFloat(t.newScore),
    date: new Date(t.changedAt),
  }));

  // Add current score as the latest point if different from last trend entry
  if (currentScore !== null && points.length > 0) {
    const lastPoint = points[points.length - 1];
    if (Math.abs(lastPoint.score - currentScore) >= 0.05) {
      points.push({ score: currentScore, date: new Date() });
    }
  }

  if (points.length < 2) {
    // Show single-point summary
    const first = parseFloat(trend[0].oldScore);
    const last = parseFloat(trend[0].newScore);
    const delta = last - first;
    const isUp = delta > 0;
    return (
      <div className="flex items-center gap-[var(--space-3)]">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
          {first.toFixed(1)} → {last.toFixed(1)}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          fontWeight: 600,
          color: isUp ? "var(--score-high)" : "var(--score-low)",
        }}>
          {isUp ? "▲" : "▼"}{Math.abs(delta).toFixed(1)}
        </span>
      </div>
    );
  }

  // SVG sparkline
  const width = 280;
  const height = 60;
  const padding = { top: 8, right: 8, bottom: 8, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const scores = points.map((p) => p.score);
  const minScore = Math.max(0, Math.min(...scores) - 0.5);
  const maxScore = Math.min(10, Math.max(...scores) + 0.5);
  const range = maxScore - minScore || 1;

  const pathPoints = points.map((p, i) => {
    const x = padding.left + (i / (points.length - 1)) * chartW;
    const y = padding.top + chartH - ((p.score - minScore) / range) * chartH;
    return { x, y };
  });

  const linePath = pathPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Gradient fill under line
  const areaPath = `${linePath} L ${pathPoints[pathPoints.length - 1].x} ${padding.top + chartH} L ${pathPoints[0].x} ${padding.top + chartH} Z`;

  const firstScore = points[0].score;
  const lastScore = points[points.length - 1].score;
  const totalDelta = lastScore - firstScore;
  const isUp = totalDelta > 0;

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-2)" }}>
        <div className="flex items-baseline gap-[var(--space-2)]">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
            {lastScore.toFixed(1)}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 600,
            color: isUp ? "var(--score-high)" : totalDelta < 0 ? "var(--score-low)" : "var(--text-muted)",
          }}>
            {isUp ? "▲" : totalDelta < 0 ? "▼" : "—"}{Math.abs(totalDelta).toFixed(1)} overall
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
          {points.length} updates
        </span>
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? "var(--score-high)" : "var(--score-low)"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? "var(--score-high)" : "var(--score-low)"} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sparkGrad)" />
        <path d={linePath} fill="none" stroke={isUp ? "var(--score-high)" : "var(--score-low)"} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pathPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === pathPoints.length - 1 ? 4 : 2.5} fill={isUp ? "var(--score-high)" : "var(--score-low)"} stroke="var(--bg-surface)" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex justify-between" style={{ marginTop: "2px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
          {points[0].date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
          {points[points.length - 1].date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

function ToolSubscribeForm({ toolName }: { toolName: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    setStatus("sending");
    try {
      const res = await fetch("/api/v1/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok || res.status === 409) {
        form.reset();
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--score-high)" }}>
        Check your email to confirm your subscription.
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>
        Get notified when {toolName}&apos;s scores are updated.
      </p>
      {status === "error" && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--score-low)", marginBottom: "var(--space-1)" }}>
          Something went wrong. Try again.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-[var(--space-1)]">
        <label htmlFor="subscribe-email" className="sr-only">Email address</label>
        <input
          id="subscribe-email"
          name="email"
          type="email"
          placeholder="you@company.com"
          required
          style={{
            flex: 1,
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            padding: "5px 10px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 600,
            padding: "5px 12px",
            background: "var(--accent-primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            cursor: status === "sending" ? "wait" : "pointer",
            opacity: status === "sending" ? 0.7 : 1,
          }}
        >
          {status === "sending" ? "..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
}
