"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";

interface ToolScore {
  dimension: string;
  score: number | null;
}

export interface QuadrantTool {
  toolId: string;
  toolName: string;
  toolSlug: string;
  logoUrl?: string | null;
  xPosition: number;
  yPosition: number;
  overallScore?: number | null;
  category?: string;
  scores?: ToolScore[];
}

// Generic entity type for domain-agnostic quadrant rendering
export interface GenericQuadrantEntity {
  id: string;
  label: string;
  x: number;          // 0-100
  y: number;          // 0-100
  colorValue?: number; // For color mapping (e.g., score 0-10)
  sizeValue?: number;  // For size mapping
  subtitle?: string;   // Secondary label (e.g., category)
  scores?: { dimension: string; score: number | null }[];
  metadata?: Record<string, unknown>;
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
  fullPage?: boolean;
  maxHeight?: string;
  onToolClick?: (tool: QuadrantTool) => void;
}

// Generic props for domain-agnostic usage
export interface GenericQuadrantChartProps {
  xAxisLabel: string;
  yAxisLabel: string;
  quadrantLabels: {
    topRight: string;
    topLeft: string;
    bottomRight: string;
    bottomLeft: string;
  };
  entities: GenericQuadrantEntity[];
  fullPage?: boolean;
  maxHeight?: string;
  onEntityClick?: (entity: GenericQuadrantEntity) => void;
  colorScale?: (value: number) => string;
  sizeScale?: (value: number) => number;
}

interface TooltipState {
  tool: QuadrantTool;
  x: number;
  y: number;
}

export function QuadrantChart({
  xAxisLabel,
  yAxisLabel,
  quadrantLabels,
  positions,
  fullPage = false,
  maxHeight,
  onToolClick,
}: QuadrantChartProps) {
  const width = 900;
  const height = 650;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [activeQuadrant, setActiveQuadrant] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scaleX = (value: number) => padding.left + (value / 100) * plotWidth;
  const scaleY = (value: number) => padding.top + ((100 - value) / 100) * plotHeight;

  const midX = scaleX(50);
  const midY = scaleY(50);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!fullPage) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((z) => Math.min(4, Math.max(1, z + delta)));
  }, [fullPage]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!fullPage || zoom <= 1) return;
    if ((e.target as SVGElement).closest("[data-tool-dot]")) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [fullPage, zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Close tooltip on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTooltip(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Determine which quadrant a tool is in
  const getToolQuadrant = (tool: QuadrantTool) => {
    if (tool.xPosition >= 50 && tool.yPosition >= 50) return "topRight";
    if (tool.xPosition < 50 && tool.yPosition >= 50) return "topLeft";
    if (tool.xPosition >= 50 && tool.yPosition < 50) return "bottomRight";
    return "bottomLeft";
  };

  const quadrantColors: Record<string, string> = {
    topRight: "var(--quadrant-leaders)",
    topLeft: "var(--quadrant-visionaries)",
    bottomRight: "var(--quadrant-challengers)",
    bottomLeft: "var(--quadrant-niche)",
  };

  const toolsInQuadrant = activeQuadrant
    ? positions.filter((t) => getToolQuadrant(t) === activeQuadrant).length
    : 0;

  const handleDotHover = (tool: QuadrantTool, e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      tool,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const scoreColor = (s: number) => s >= 8 ? "var(--score-high)" : s >= 5 ? "var(--score-mid)" : "var(--score-low)";

  const viewBox = fullPage
    ? `${-pan.x / zoom} ${-pan.y / zoom} ${width / zoom} ${height / zoom}`
    : `0 0 ${width} ${height}`;

  const svgHeight = fullPage ? "80vh" : maxHeight || "auto";

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", minHeight: fullPage ? "80vh" : "auto" }}
    >
      <svg
        viewBox={viewBox}
        style={{
          width: "100%",
          height: svgHeight,
          maxHeight: maxHeight || undefined,
          cursor: isPanning ? "grabbing" : fullPage && zoom > 1 ? "grab" : "default",
          touchAction: fullPage && zoom > 1 ? "none" : "auto",
        }}
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setTooltip(null); }}
        role="img"
        aria-label={`Quadrant chart: ${xAxisLabel} vs ${yAxisLabel} with ${positions.length} tools`}
      >
        {/* Quadrant background regions */}
        <rect x={padding.left} y={padding.top} width={plotWidth / 2} height={plotHeight / 2}
          fill="var(--quadrant-visionaries)"
          fillOpacity={activeQuadrant && activeQuadrant !== "topLeft" ? 0.02 : 0.05}
          style={{ cursor: "pointer" }}
          onClick={() => setActiveQuadrant(activeQuadrant === "topLeft" ? null : "topLeft")}
        />
        <rect x={midX} y={padding.top} width={plotWidth / 2} height={plotHeight / 2}
          fill="var(--quadrant-leaders)"
          fillOpacity={activeQuadrant && activeQuadrant !== "topRight" ? 0.02 : 0.08}
          style={{ cursor: "pointer" }}
          onClick={() => setActiveQuadrant(activeQuadrant === "topRight" ? null : "topRight")}
        />
        <rect x={padding.left} y={midY} width={plotWidth / 2} height={plotHeight / 2}
          fill="var(--quadrant-niche)"
          fillOpacity={activeQuadrant && activeQuadrant !== "bottomLeft" ? 0.02 : 0.05}
          style={{ cursor: "pointer" }}
          onClick={() => setActiveQuadrant(activeQuadrant === "bottomLeft" ? null : "bottomLeft")}
        />
        <rect x={midX} y={midY} width={plotWidth / 2} height={plotHeight / 2}
          fill="var(--quadrant-challengers)"
          fillOpacity={activeQuadrant && activeQuadrant !== "bottomRight" ? 0.02 : 0.05}
          style={{ cursor: "pointer" }}
          onClick={() => setActiveQuadrant(activeQuadrant === "bottomRight" ? null : "bottomRight")}
        />

        {/* Grid lines */}
        {[25, 50, 75].map((tick) => (
          <g key={`grid-${tick}`}>
            <line x1={scaleX(tick)} y1={padding.top} x2={scaleX(tick)} y2={padding.top + plotHeight}
              stroke="var(--border-default)" strokeWidth={0.5} strokeDasharray={tick === 50 ? "none" : "4,4"} />
            <line x1={padding.left} y1={scaleY(tick)} x2={padding.left + plotWidth} y2={scaleY(tick)}
              stroke="var(--border-default)" strokeWidth={0.5} strokeDasharray={tick === 50 ? "none" : "4,4"} />
          </g>
        ))}

        {/* Center lines */}
        <line x1={midX} y1={padding.top} x2={midX} y2={padding.top + plotHeight}
          stroke="var(--border-strong)" strokeWidth={1} />
        <line x1={padding.left} y1={midY} x2={padding.left + plotWidth} y2={midY}
          stroke="var(--border-strong)" strokeWidth={1} />

        {/* Border */}
        <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight}
          fill="none" stroke="var(--border-strong)" strokeWidth={1} />

        {/* Quadrant labels */}
        {([
          { key: "topRight", x: midX + plotWidth / 4, y: padding.top + 22, color: quadrantColors.topRight },
          { key: "topLeft", x: padding.left + plotWidth / 4, y: padding.top + 22, color: quadrantColors.topLeft },
          { key: "bottomRight", x: midX + plotWidth / 4, y: padding.top + plotHeight - 10, color: quadrantColors.bottomRight },
          { key: "bottomLeft", x: padding.left + plotWidth / 4, y: padding.top + plotHeight - 10, color: quadrantColors.bottomLeft },
        ] as const).map((q) => (
          <text
            key={q.key}
            x={q.x}
            y={q.y}
            textAnchor="middle"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: fullPage ? "12px" : "10px",
              fontWeight: activeQuadrant === q.key ? 700 : 400,
              fill: q.color,
              opacity: activeQuadrant && activeQuadrant !== q.key ? 0.3 : 0.8,
              cursor: "pointer",
            }}
            onClick={() => setActiveQuadrant(activeQuadrant === q.key ? null : q.key)}
          >
            {quadrantLabels[q.key]}
            {activeQuadrant === q.key && ` (${toolsInQuadrant})`}
          </text>
        ))}

        {/* Axis labels */}
        <text x={width / 2} y={height - 12}
          textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fill: "var(--text-secondary)" }}>
          {xAxisLabel} →
        </text>
        <text x={16} y={height / 2}
          textAnchor="middle" transform={`rotate(-90, 16, ${height / 2})`}
          style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fill: "var(--text-secondary)" }}>
          {yAxisLabel} ↑
        </text>

        {/* Tool dots */}
        {positions.map((tool, i) => {
          const cx = scaleX(tool.xPosition);
          const cy = scaleY(tool.yPosition);
          const toolQuadrant = getToolQuadrant(tool);
          const isDimmed = activeQuadrant !== null && toolQuadrant !== activeQuadrant;
          const dotColor = quadrantColors[toolQuadrant] || "var(--accent-primary)";

          return (
            <g key={tool.toolId} data-tool-dot>
              <motion.circle
                cx={cx}
                cy={cy}
                r={fullPage ? 10 : 8}
                fill={dotColor}
                fillOpacity={isDimmed ? 0.15 : 0.85}
                stroke={dotColor}
                strokeWidth={2}
                strokeOpacity={isDimmed ? 0.2 : 1}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.4, type: "spring" }}
                className="cursor-pointer"
                whileHover={{ r: fullPage ? 14 : 12, fillOpacity: 1 }}
                onMouseEnter={(e) => handleDotHover(tool, e as unknown as React.MouseEvent)}
                onMouseLeave={() => setTooltip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToolClick) {
                    onToolClick(tool);
                  }
                }}
              />
              <motion.text
                x={cx}
                y={cy - (fullPage ? 16 : 14)}
                textAnchor="middle"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: fullPage ? "11px" : "10px",
                  fontWeight: 600,
                  fill: "var(--text-primary)",
                  opacity: isDimmed ? 0.2 : 1,
                  pointerEvents: "none",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: isDimmed ? 0.2 : 1 }}
                transition={{ delay: i * 0.05 + 0.2, duration: 0.3 }}
              >
                {tool.toolName}
              </motion.text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth || 400) - 220),
              top: Math.max(tooltip.y - 10, 0),
              zIndex: 50,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              minWidth: "200px",
              maxWidth: "260px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                {tooltip.tool.toolName}
              </span>
              {tooltip.tool.overallScore != null && (
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700,
                  color: scoreColor(tooltip.tool.overallScore),
                  marginLeft: "auto",
                }}>
                  {tooltip.tool.overallScore.toFixed(1)}
                </span>
              )}
            </div>
            {tooltip.tool.category && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "6px" }}>
                {tooltip.tool.category}
              </div>
            )}
            {tooltip.tool.scores && tooltip.tool.scores.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {tooltip.tool.scores.filter(s => s.score != null).slice(0, 4).map((s) => (
                  <div key={s.dimension} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", width: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.dimension.replace(/ /g, "").slice(0, 8)}
                    </span>
                    <div style={{ flex: 1, height: "3px", background: "var(--bg-elevated)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: `${((s.score || 0) / 10) * 100}%`, height: "100%", background: scoreColor(s.score || 0), borderRadius: "2px" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 600, color: "var(--text-primary)", width: "20px", textAlign: "right" }}>
                      {(s.score || 0).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset zoom button */}
      {fullPage && zoom > 1 && (
        <button
          onClick={resetZoom}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            padding: "6px 12px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          Reset zoom ({zoom.toFixed(1)}x)
        </button>
      )}

      {/* Active quadrant filter badge */}
      {activeQuadrant && (
        <button
          onClick={() => setActiveQuadrant(null)}
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            padding: "4px 10px",
            background: quadrantColors[activeQuadrant],
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          {quadrantLabels[activeQuadrant as keyof typeof quadrantLabels]} ({toolsInQuadrant}) ✕
        </button>
      )}
    </div>
  );
}

/**
 * Generic domain-agnostic quadrant chart.
 * Accepts GenericQuadrantEntity[] and renders using the same visualization.
 * Used by new verticals (PainGaps, FinServ) while the original QuadrantChart
 * remains unchanged for the existing tools pages.
 */
export function GenericQuadrantChart({
  xAxisLabel,
  yAxisLabel,
  quadrantLabels,
  entities,
  fullPage = false,
  maxHeight,
  onEntityClick,
  colorScale,
  sizeScale,
}: GenericQuadrantChartProps) {
  // Map generic entities to the existing QuadrantTool interface
  const positions: QuadrantTool[] = entities.map((e) => ({
    toolId: e.id,
    toolName: e.label,
    toolSlug: e.id,
    xPosition: e.x,
    yPosition: e.y,
    overallScore: e.colorValue ?? null,
    category: e.subtitle,
    scores: e.scores,
  }));

  return (
    <QuadrantChart
      xAxisLabel={xAxisLabel}
      yAxisLabel={yAxisLabel}
      quadrantLabels={quadrantLabels}
      positions={positions}
      fullPage={fullPage}
      maxHeight={maxHeight}
      onToolClick={onEntityClick ? (tool) => {
        const entity = entities.find((e) => e.id === tool.toolId);
        if (entity) onEntityClick(entity);
      } : undefined}
    />
  );
}
