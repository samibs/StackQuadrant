"use client";

import { ReactNode } from "react";

interface PanelProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Panel({ title, actions, children, className = "", noPadding = false }: PanelProps) {
  return (
    <div
      className={`transition-colors duration-150 ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="flex items-center justify-between px-[var(--space-3)]"
        style={{
          height: "var(--panel-header-height)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </span>
        {actions && <div className="flex items-center gap-[var(--space-1)]">{actions}</div>}
      </div>
      <div className={noPadding ? "" : "p-[var(--space-4)]"} style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

export function PanelGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(var(--card-min-width), 1fr))`,
        gap: "var(--grid-gap)",
        padding: "var(--grid-gap)",
      }}
    >
      {children}
    </div>
  );
}
