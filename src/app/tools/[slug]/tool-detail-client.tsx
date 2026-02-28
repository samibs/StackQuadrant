"use client";

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

export function ToolDetailClient({ tool }: { tool: ToolDetail }) {
  const validScores = tool.scores.filter((s) => s.score !== null).map((s) => ({
    dimension: s.dimension,
    score: s.score!,
    description: s.dimensionDescription,
  }));

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      {/* Header */}
      <div
        className="flex items-start justify-between px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <div>
          <div className="flex items-center gap-[var(--space-2)]">
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
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>
            {tool.description}
          </p>
          <div className="flex items-center gap-[var(--space-4)] mt-[var(--space-2)]">
            {tool.vendor && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                {tool.vendor}
              </span>
            )}
            {tool.websiteUrl && (
              <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                {tool.websiteUrl}
              </a>
            )}
          </div>
        </div>
        <div className="relative" style={{ width: "72px", height: "72px" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--grid-gap)" }}>
        {/* Left column */}
        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          {/* Radar Chart */}
          <Panel title="Capability Profile">
            <div className="flex justify-center">
              <RadarChart scores={validScores} size={280} />
            </div>
          </Panel>

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
        </div>
      </div>
    </div>
  );
}
