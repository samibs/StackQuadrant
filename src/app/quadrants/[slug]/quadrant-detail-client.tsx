"use client";

import { useState } from "react";
import { QuadrantChart } from "@/components/visualizations/quadrant-chart";
import type { QuadrantTool } from "@/components/visualizations/quadrant-chart";
import { ScoreBar } from "@/components/visualizations/score-bar";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface QuadrantData {
  id: string;
  title: string;
  slug: string;
  description: string;
  xAxisLabel: string;
  yAxisLabel: string;
  quadrantLabels: { topRight: string; topLeft: string; bottomRight: string; bottomLeft: string };
  positions: Array<{
    toolId: string;
    toolName: string;
    toolSlug: string;
    logoUrl: string | null;
    overallScore: number | null;
    category: string;
    xPosition: number;
    yPosition: number;
    scores: Array<{ dimension: string; score: number | null }>;
  }>;
  publishedAt: Date | null;
}

const quadrantExplanations = [
  { label: "topRight", color: "var(--quadrant-leaders)", title: "Leaders", description: "High capability and high market presence. These tools excel in both execution and strategic vision." },
  { label: "topLeft", color: "var(--quadrant-visionaries)", title: "Visionaries", description: "Strong strategic vision but lower market presence. Innovative approaches that may define the future." },
  { label: "bottomRight", color: "var(--quadrant-challengers)", title: "Challengers", description: "Strong market presence but narrower vision. Reliable tools that serve specific use cases well." },
  { label: "bottomLeft", color: "var(--quadrant-niche)", title: "Niche Players", description: "Focused on specific segments. May excel in particular areas but have limited scope or adoption." },
];

export function QuadrantDetailClient({ quadrant }: { quadrant: QuadrantData }) {
  const [selectedTool, setSelectedTool] = useState<QuadrantTool | null>(null);

  const handleToolClick = (tool: QuadrantTool) => {
    setSelectedTool(selectedTool?.toolId === tool.toolId ? null : tool);
  };

  const selectedToolData = selectedTool
    ? quadrant.positions.find((p) => p.toolId === selectedTool.toolId)
    : null;

  const scoreColor = (s: number) => s >= 8 ? "var(--score-high)" : s >= 5 ? "var(--score-mid)" : "var(--score-low)";

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      {/* Header */}
      <div
        className="px-[var(--space-4)] py-[var(--space-3)] mb-[var(--space-3)]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          {quadrant.title}
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-1)", maxWidth: "700px" }}>
          {quadrant.description}
        </p>
        <div className="flex gap-[var(--space-4)] mt-[var(--space-2)]" style={{ flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            {quadrant.positions.length} tools positioned
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            X: {quadrant.xAxisLabel} · Y: {quadrant.yAxisLabel}
          </span>
          {quadrant.publishedAt && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              Published: {new Date(quadrant.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Chart + Side Panel */}
      <div style={{ display: "flex", gap: "var(--grid-gap)", position: "relative" }}>
        {/* Main Chart */}
        <div
          style={{
            flex: 1,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-3)",
            minHeight: "80vh",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "var(--space-2)" }}>
            Scroll to zoom · Click quadrant regions to filter · Click tools for details
          </div>
          <QuadrantChart
            xAxisLabel={quadrant.xAxisLabel}
            yAxisLabel={quadrant.yAxisLabel}
            quadrantLabels={quadrant.quadrantLabels}
            positions={quadrant.positions.map((p) => ({
              ...p,
              logoUrl: p.logoUrl ?? undefined,
            }))}
            fullPage
            onToolClick={handleToolClick}
          />
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {selectedToolData && (
            <motion.div
              className="quadrant-side-panel"
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 320 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                width: 320,
                flexShrink: 0,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "var(--space-4)",
                alignSelf: "flex-start",
                position: "sticky",
                top: "80px",
                overflow: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {selectedToolData.toolName}
                </h3>
                <button
                  onClick={() => setSelectedTool(null)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--text-muted)",
                    padding: "2px 6px",
                  }}
                  aria-label="Close panel"
                >
                  ✕
                </button>
              </div>

              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                {selectedToolData.category}
              </div>

              {/* Overall Score */}
              {selectedToolData.overallScore != null && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "var(--space-2)",
                  marginBottom: "var(--space-4)",
                  padding: "var(--space-2)",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>Overall</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700,
                    color: scoreColor(selectedToolData.overallScore),
                    marginLeft: "auto",
                  }}>
                    {selectedToolData.overallScore.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Dimension Scores */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Dimension Scores
                </span>
                {selectedToolData.scores.filter(s => s.score != null).map((s) => (
                  <ScoreBar key={s.dimension} score={s.score!} label={s.dimension} />
                ))}
              </div>

              {/* Position Info */}
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)",
                padding: "var(--space-2)",
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "var(--space-3)",
              }}>
                Position: ({selectedToolData.xPosition.toFixed(0)}, {selectedToolData.yPosition.toFixed(0)})
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Link
                  href={`/tools/${selectedToolData.toolSlug}`}
                  style={{
                    flex: 1,
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "8px 12px",
                    background: "var(--accent-primary)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    color: "#fff",
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  Full profile →
                </Link>
                <Link
                  href={`/compare?tools=${selectedToolData.toolSlug}`}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    padding: "8px 12px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                  }}
                >
                  Compare
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quadrant Legend */}
      <div
        className="mt-[var(--space-4)]"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
          gap: "var(--grid-gap)",
        }}
      >
        {quadrantExplanations.map((q) => (
          <div
            key={q.label}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-3)",
              borderLeft: `3px solid ${q.color}`,
            }}
          >
            <div className="flex items-center gap-[var(--space-2)]">
              <span style={{ width: 10, height: 10, borderRadius: 2, background: q.color, opacity: 0.3, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                {quadrant.quadrantLabels[q.label as keyof typeof quadrant.quadrantLabels] || q.title}
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "var(--space-1)", lineHeight: "1.4" }}>
              {q.description}
            </p>
          </div>
        ))}
      </div>

      {/* Axis explanation */}
      <div
        className="mt-[var(--space-3)] flex gap-[var(--space-4)]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>X-Axis:</span> {quadrant.xAxisLabel}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Y-Axis:</span> {quadrant.yAxisLabel}
        </div>
      </div>
    </div>
  );
}
