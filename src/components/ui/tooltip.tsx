"use client";

import { useCallback, useState, useId, type ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  const [active, setActive] = useState(false);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setActive((v) => !v);
  }, []);

  return (
    <span
      className={`sq-tooltip-wrap${active ? " sq-tooltip-active" : ""}`}
      onTouchStart={handleTouch}
      onBlur={() => setActive(false)}
    >
      {children}
      <span className="sq-tooltip" role="tooltip" id={id}>
        {content}
      </span>
    </span>
  );
}

interface InfoIconProps {
  tip: ReactNode;
}

export function InfoIcon({ tip }: InfoIconProps) {
  return (
    <Tooltip content={tip}>
      <span className="sq-info-icon" aria-label="More info">?</span>
    </Tooltip>
  );
}

export function ScoreLegend() {
  return (
    <div className="flex items-center gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
      <span className="flex items-center gap-1">
        <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--score-high)", display: "inline-block" }} />
        <span style={{ color: "var(--text-muted)" }}>8-10</span>
      </span>
      <span className="flex items-center gap-1">
        <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--score-mid)", display: "inline-block" }} />
        <span style={{ color: "var(--text-muted)" }}>5-7.9</span>
      </span>
      <span className="flex items-center gap-1">
        <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--score-low)", display: "inline-block" }} />
        <span style={{ color: "var(--text-muted)" }}>&lt;5</span>
      </span>
    </div>
  );
}
