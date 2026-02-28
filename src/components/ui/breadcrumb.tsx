import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-muted)",
        marginBottom: "var(--space-3)",
        padding: "var(--space-1) 0",
      }}
    >
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span style={{ margin: "0 6px", opacity: 0.5 }}>/</span>}
          {item.href ? (
            <Link href={item.href} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--text-primary)" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
