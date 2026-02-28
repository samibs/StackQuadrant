"use client";

import { QuadrantChart } from "@/components/visualizations/quadrant-chart";

interface QuadrantData {
  id: string;
  title: string;
  slug: string;
  description: string;
  xAxisLabel: string;
  yAxisLabel: string;
  quadrantLabels: { topRight: string; topLeft: string; bottomRight: string; bottomLeft: string };
  positions: Array<{ toolId: string; toolName: string; toolSlug: string; logoUrl: string | null; xPosition: number; yPosition: number }>;
  publishedAt: Date | null;
}

const quadrantExplanations = [
  {
    label: "topRight",
    color: "var(--quadrant-leaders)",
    title: "Leaders",
    description: "High capability and high market presence. These tools excel in both execution and strategic vision.",
  },
  {
    label: "topLeft",
    color: "var(--quadrant-visionaries)",
    title: "Visionaries",
    description: "Strong strategic vision but lower market presence. Innovative approaches that may define the future of the category.",
  },
  {
    label: "bottomRight",
    color: "var(--quadrant-challengers)",
    title: "Challengers",
    description: "Strong market presence but narrower vision. Reliable tools that serve specific use cases well.",
  },
  {
    label: "bottomLeft",
    color: "var(--quadrant-niche)",
    title: "Niche Players",
    description: "Focused on specific segments. May excel in particular areas but have limited scope or adoption.",
  },
];

export function QuadrantDetailClient({ quadrant }: { quadrant: QuadrantData }) {
  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      {/* Header */}
      <div
        className="px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
          {quadrant.title}
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>
          {quadrant.description}
        </p>
        <div className="flex gap-[var(--space-4)] mt-[var(--space-2)]">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            {quadrant.positions.length} tools positioned
          </span>
          {quadrant.publishedAt && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              Published: {new Date(quadrant.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--space-4)",
        }}
      >
        <QuadrantChart
          xAxisLabel={quadrant.xAxisLabel}
          yAxisLabel={quadrant.yAxisLabel}
          quadrantLabels={quadrant.quadrantLabels}
          positions={quadrant.positions.map((p) => ({ ...p, logoUrl: p.logoUrl ?? undefined }))}
        />
      </div>

      {/* Quadrant Legend */}
      <div
        className="mt-[var(--grid-gap)]"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: q.color,
                  opacity: 0.3,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
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
        className="mt-[var(--grid-gap)] flex gap-[var(--space-4)]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--space-3)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>X-Axis:</span> {quadrant.xAxisLabel} — measures the tool&apos;s practical execution capability
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Y-Axis:</span> {quadrant.yAxisLabel} — measures strategic value and forward-looking potential
        </div>
      </div>
    </div>
  );
}
