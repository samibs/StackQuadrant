export function Skeleton({ className = "", width = "100%", height = "14px" }: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`skeleton-line ${className}`}
      style={{ width, height }}
    />
  );
}

export function PanelSkeleton() {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
        minHeight: "var(--panel-min-height)",
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center px-[var(--space-3)]"
        style={{
          height: "var(--panel-header-height)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Skeleton width="120px" height="12px" />
      </div>
      <div className="p-[var(--space-3)] flex flex-col gap-[var(--space-2)]">
        <Skeleton width="85%" />
        <Skeleton width="75%" />
        <Skeleton width="60%" />
        <Skeleton width="50%" />
        <Skeleton width="40%" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(var(--card-min-width), 1fr))`,
        gap: "var(--grid-gap)",
        padding: "var(--grid-gap)",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <PanelSkeleton key={i} />
      ))}
    </div>
  );
}
