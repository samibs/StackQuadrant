"use client";

export function SuggestCorrectionLink({ toolSlug, toolName }: { toolSlug: string; toolName: string }) {
  const handleClick = () => {
    // Dispatch a custom event that the AskWidget listens for
    window.dispatchEvent(
      new CustomEvent("sq-open-suggest", { detail: { slug: toolSlug, name: toolName } })
    );
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "var(--space-1) var(--space-3)",
        background: "transparent",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-muted)",
        cursor: "pointer",
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-primary)";
        e.currentTarget.style.color = "var(--accent-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.color = "var(--text-muted)";
      }}
      title="Suggest a correction to this tool's data"
    >
      ✎ Suggest a correction
    </button>
  );
}
