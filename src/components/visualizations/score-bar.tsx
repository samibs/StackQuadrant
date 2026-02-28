"use client";

import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

interface ScoreBarProps {
  score: number;
  maxScore?: number;
  label?: string;
  showValue?: boolean;
  tooltip?: ReactNode;
  evidence?: string | null;
}

export function ScoreBar({ score, maxScore = 10, label, showValue = true, tooltip, evidence }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;
  const color = score >= 8 ? "var(--score-high)" : score >= 5 ? "var(--score-mid)" : "var(--score-low)";

  return (
    <div role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={maxScore} aria-label={label ? `${label}: ${score.toFixed(1)} out of ${maxScore}` : `Score: ${score.toFixed(1)} out of ${maxScore}`}>
      <div className="flex items-center gap-[var(--space-2)] w-full">
        {label && (
          <span
            className="shrink-0 flex items-center gap-1"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-secondary)",
              width: "120px",
            }}
          >
            {tooltip ? (
              <Tooltip content={tooltip}>
                <span style={{ cursor: "help", borderBottom: "1px dotted var(--border-strong)" }}>{label}</span>
              </Tooltip>
            ) : (
              label
            )}
          </span>
        )}
        <div
          className="flex-1 relative"
          style={{
            height: "6px",
            background: "var(--bg-elevated)",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <motion.div
            style={{
              height: "100%",
              background: color,
              borderRadius: "3px",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {showValue && (
          <span
            className="shrink-0"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-primary)",
              width: "28px",
              textAlign: "right",
            }}
          >
            {score.toFixed(1)}
          </span>
        )}
      </div>
      {evidence && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontStyle: "italic",
            color: "var(--text-muted)",
            marginTop: "2px",
            marginLeft: label ? "128px" : 0,
            lineHeight: "1.4",
          }}
        >
          {evidence}
        </p>
      )}
    </div>
  );
}
