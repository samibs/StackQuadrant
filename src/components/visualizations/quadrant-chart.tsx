"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface QuadrantTool {
  toolId: string;
  toolName: string;
  toolSlug: string;
  logoUrl?: string;
  xPosition: number;
  yPosition: number;
}

interface QuadrantChartProps {
  xAxisLabel: string;
  yAxisLabel: string;
  quadrantLabels: {
    topRight: string;
    topLeft: string;
    bottomRight: string;
    bottomLeft: string;
  };
  positions: QuadrantTool[];
  width?: number;
  height?: number;
}

export function QuadrantChart({
  xAxisLabel,
  yAxisLabel,
  quadrantLabels,
  positions,
  width = 800,
  height = 550,
}: QuadrantChartProps) {
  const padding = { top: 30, right: 30, bottom: 50, left: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const scaleX = (value: number) => padding.left + (value / 100) * plotWidth;
  const scaleY = (value: number) => padding.top + ((100 - value) / 100) * plotHeight;

  const midX = scaleX(50);
  const midY = scaleY(50);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet">
      {/* Quadrant background regions */}
      <rect x={padding.left} y={padding.top} width={plotWidth / 2} height={plotHeight / 2}
        fill="var(--quadrant-visionaries)" fillOpacity={0.05} />
      <rect x={midX} y={padding.top} width={plotWidth / 2} height={plotHeight / 2}
        fill="var(--quadrant-leaders)" fillOpacity={0.08} />
      <rect x={padding.left} y={midY} width={plotWidth / 2} height={plotHeight / 2}
        fill="var(--quadrant-niche)" fillOpacity={0.05} />
      <rect x={midX} y={midY} width={plotWidth / 2} height={plotHeight / 2}
        fill="var(--quadrant-challengers)" fillOpacity={0.05} />

      {/* Grid lines */}
      {[25, 50, 75].map((tick) => (
        <g key={`grid-${tick}`}>
          <line x1={scaleX(tick)} y1={padding.top} x2={scaleX(tick)} y2={padding.top + plotHeight}
            stroke="var(--border-default)" strokeWidth={0.5} strokeDasharray={tick === 50 ? "none" : "4,4"} />
          <line x1={padding.left} y1={scaleY(tick)} x2={padding.left + plotWidth} y2={scaleY(tick)}
            stroke="var(--border-default)" strokeWidth={0.5} strokeDasharray={tick === 50 ? "none" : "4,4"} />
        </g>
      ))}

      {/* Center lines (stronger) */}
      <line x1={midX} y1={padding.top} x2={midX} y2={padding.top + plotHeight}
        stroke="var(--border-strong)" strokeWidth={1} />
      <line x1={padding.left} y1={midY} x2={padding.left + plotWidth} y2={midY}
        stroke="var(--border-strong)" strokeWidth={1} />

      {/* Border */}
      <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight}
        fill="none" stroke="var(--border-strong)" strokeWidth={1} />

      {/* Quadrant labels */}
      <text x={midX + plotWidth / 4} y={padding.top + 18}
        textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fill: "var(--quadrant-leaders)", opacity: 0.7 }}>
        {quadrantLabels.topRight}
      </text>
      <text x={padding.left + plotWidth / 4} y={padding.top + 18}
        textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fill: "var(--quadrant-visionaries)", opacity: 0.7 }}>
        {quadrantLabels.topLeft}
      </text>
      <text x={midX + plotWidth / 4} y={padding.top + plotHeight - 8}
        textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fill: "var(--quadrant-challengers)", opacity: 0.7 }}>
        {quadrantLabels.bottomRight}
      </text>
      <text x={padding.left + plotWidth / 4} y={padding.top + plotHeight - 8}
        textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fill: "var(--quadrant-niche)", opacity: 0.7 }}>
        {quadrantLabels.bottomLeft}
      </text>

      {/* Axis labels */}
      <text x={width / 2} y={height - 8}
        textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fill: "var(--text-secondary)" }}>
        {xAxisLabel} &rarr;
      </text>
      <text x={14} y={height / 2}
        textAnchor="middle" transform={`rotate(-90, 14, ${height / 2})`}
        style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fill: "var(--text-secondary)" }}>
        {yAxisLabel} &uarr;
      </text>

      {/* Tool dots */}
      {positions.map((tool, i) => {
        const cx = scaleX(tool.xPosition);
        const cy = scaleY(tool.yPosition);
        return (
          <g key={tool.toolId}>
            <Link href={`/tools/${tool.toolSlug}`}>
              <motion.circle
                cx={cx}
                cy={cy}
                r={8}
                fill="var(--accent-primary)"
                fillOpacity={0.8}
                stroke="var(--accent-primary)"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.4, type: "spring" }}
                className="cursor-pointer"
                whileHover={{ r: 12, fillOpacity: 1 }}
              />
              <motion.text
                x={cx}
                y={cy - 14}
                textAnchor="middle"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "10px",
                  fontWeight: 600,
                  fill: "var(--text-primary)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.2, duration: 0.3 }}
              >
                {tool.toolName}
              </motion.text>
            </Link>
          </g>
        );
      })}
    </svg>
  );
}
