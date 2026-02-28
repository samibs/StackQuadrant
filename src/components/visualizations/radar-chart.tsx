"use client";

import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/tooltip";

interface RadarChartProps {
  scores: Array<{ dimension: string; score: number; description?: string | null }>;
  size?: number;
  maxScore?: number;
}

export function RadarChart({ scores, size = 240, maxScore = 10 }: RadarChartProps) {
  // Add padding so labels fit within bounds (no clipping by overflow:hidden parents)
  const padding = 30;
  const totalSize = size + padding * 2;
  const center = totalSize / 2;
  const radius = (size - 60) / 2;
  const angleStep = (2 * Math.PI) / scores.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / maxScore) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = scores.map((s, i) => getPoint(i, s.score));
  const pathData = dataPoints.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(" ") + " Z";

  // Calculate label positions for HTML overlay
  const labelPositions = scores.map((s, i) => {
    const labelPoint = getPoint(i, maxScore + 2);
    const angle = angleStep * i - Math.PI / 2;
    const cosA = Math.cos(angle);
    const textAlign = Math.abs(cosA) < 0.1 ? "center" : cosA > 0 ? "left" : "right";
    return { ...labelPoint, textAlign, dimension: s.dimension, description: s.description };
  });

  return (
    <div style={{ position: "relative", width: totalSize, height: totalSize }}>
      <svg width={totalSize} height={totalSize} viewBox={`0 0 ${totalSize} ${totalSize}`} role="img" aria-label={`Capability profile radar chart showing ${scores.map(s => `${s.dimension}: ${s.score}`).join(", ")}`}>
        {/* Grid circles */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={scores.map((_, i) => {
              const p = getPoint(i, maxScore * level);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines */}
        {scores.map((_, i) => {
          const end = getPoint(i, maxScore);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="var(--border-default)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data polygon */}
        <motion.path
          d={pathData}
          fill="var(--accent-primary)"
          fillOpacity={0.15}
          stroke="var(--accent-primary)"
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Score dots */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="var(--accent-primary)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          />
        ))}
      </svg>

      {/* HTML overlay labels with tooltip support */}
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
          {lp.description ? (
            <Tooltip content={lp.description}>
              <span style={{ cursor: "help", borderBottom: "1px dotted var(--border-strong)" }}>{lp.dimension}</span>
            </Tooltip>
          ) : (
            lp.dimension
          )}
        </div>
      ))}
    </div>
  );
}
