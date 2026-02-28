"use client";

import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  tooltip?: ReactNode;
}

export function ScoreRing({ score, maxScore = 10, size = 64, strokeWidth = 5, label, tooltip }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score / maxScore;
  const offset = circumference * (1 - progress);

  const color = score >= 8 ? "var(--score-high)" : score >= 5 ? "var(--score-mid)" : "var(--score-low)";

  const ring = (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Score: ${score.toFixed(1)} out of ${maxScore}`} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          width: size,
          height: size,
          fontFamily: "var(--font-mono)",
        }}
      >
        <span style={{ fontSize: size > 50 ? "18px" : "14px", fontWeight: 700, color: "var(--text-primary)" }}>
          {score.toFixed(1)}
        </span>
        {label && (
          <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>/{maxScore}</span>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{ring}</Tooltip>;
  }

  return ring;
}
