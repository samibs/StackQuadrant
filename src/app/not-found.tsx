import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        minHeight: "calc(100vh - var(--header-height))",
        padding: "var(--space-6)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "72px",
          fontWeight: 700,
          color: "var(--accent-primary)",
          lineHeight: 1,
        }}
      >
        404
      </div>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          color: "var(--text-secondary)",
          margin: "var(--space-3) 0 var(--space-5)",
        }}
      >
        This page doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-[var(--space-3)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
        <Link
          href="/"
          style={{
            padding: "8px 16px",
            background: "var(--accent-primary)",
            color: "#fff",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
          }}
        >
          Home
        </Link>
        <Link
          href="/matrix"
          style={{
            padding: "8px 16px",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
          }}
        >
          Matrix
        </Link>
        <Link
          href="/help"
          style={{
            padding: "8px 16px",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
          }}
        >
          Help
        </Link>
      </div>
    </div>
  );
}
