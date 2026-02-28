"use client";

import { motion } from "framer-motion";

const TOOL_COLORS = [
  "var(--accent-primary)",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
];

interface ToolScores {
  name: string;
  scores: Array<{ dimension: string; score: number }>;
}

interface CompareRadarChartProps {
  tools: ToolScores[];
  size?: number;
  maxScore?: number;
}

export function CompareRadarChart({ tools, size = 320, maxScore = 10 }: CompareRadarChartProps) {
  if (tools.length === 0 || tools[0].scores.length === 0) return null;

  const dimensions = tools[0].scores.map((s) => s.dimension);
  const center = size / 2;
  const radius = (size - 80) / 2;
  const angleStep = (2 * Math.PI) / dimensions.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / maxScore) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const labelPositions = dimensions.map((dim, i) => {
    const labelPoint = getPoint(i, maxScore + 2.5);
    const angle = angleStep * i - Math.PI / 2;
    const cosA = Math.cos(angle);
    const textAlign = Math.abs(cosA) < 0.1 ? "center" : cosA > 0 ? "left" : "right";
    return { ...labelPoint, textAlign, dimension: dim };
  });

  return (
    <div>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid */}
          {gridLevels.map((level) => (
            <polygon
              key={level}
              points={dimensions.map((_, i) => {
                const p = getPoint(i, maxScore * level);
                return `${p.x},${p.y}`;
              }).join(" ")}
              fill="none"
              stroke="var(--border-default)"
              strokeWidth={0.5}
            />
          ))}

          {/* Axes */}
          {dimensions.map((_, i) => {
            const end = getPoint(i, maxScore);
            return (
              <line key={`axis-${i}`} x1={center} y1={center} x2={end.x} y2={end.y} stroke="var(--border-default)" strokeWidth={0.5} />
            );
          })}

          {/* Tool polygons */}
          {tools.map((tool, ti) => {
            const color = TOOL_COLORS[ti % TOOL_COLORS.length];
            const dataPoints = tool.scores.map((s, i) => getPoint(i, s.score));
            const pathData = dataPoints.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(" ") + " Z";

            return (
              <g key={tool.name}>
                <motion.path
                  d={pathData}
                  fill={color}
                  fillOpacity={0.08}
                  stroke={color}
                  strokeWidth={1.5}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: ti * 0.15 }}
                />
                {dataPoints.map((p, i) => (
                  <motion.circle
                    key={`dot-${ti}-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill={color}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: ti * 0.15 + i * 0.03, duration: 0.2 }}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Dimension labels */}
        {labelPositions.map((lp, i) => (
          <div
            key={`label-${i}`}
            style={{
              position: "absolute",
              left: lp.x,
              top: lp.y,
              transform: `translate(${lp.textAlign === "center" ? "-50%" : lp.textAlign === "right" ? "-100%" : "0"}, -50%)`,
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {lp.dimension}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-[var(--space-3)]" style={{ marginTop: "var(--space-3)" }}>
        {tools.map((tool, ti) => (
          <div key={tool.name} className="flex items-center gap-[var(--space-1)]">
            <div style={{ width: 10, height: 10, borderRadius: "2px", background: TOOL_COLORS[ti % TOOL_COLORS.length] }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-primary)" }}>{tool.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
