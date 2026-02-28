"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";

const NAV_ITEMS = [
  { label: "MATRIX", href: "/matrix" },
  { label: "QUADRANTS", href: "/quadrants" },
  { label: "BENCHMARKS", href: "/benchmarks" },
  { label: "STACKS", href: "/stacks" },
  { label: "HELP", href: "/help" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[var(--space-3)] select-none"
      style={{
        height: "var(--header-height)",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center gap-[var(--space-2)]">
        <Link
          href="/"
          className="flex items-center gap-[var(--space-2)] no-underline"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "13px", color: "var(--accent-primary)" }}
        >
          <span className="status-dot" />
          STACKQUADRANT
        </Link>

        <nav className="flex items-center gap-[var(--space-1)] ml-[var(--space-4)]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="no-underline transition-colors duration-150"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: "var(--radius-sm)",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-elevated)" : "transparent",
                  border: isActive ? "1px solid var(--border-strong)" : "1px solid transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-[var(--space-2)]">
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
            document.dispatchEvent(event);
          }}
          className="flex items-center gap-1 cursor-pointer"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--text-muted)",
          }}
        >
          <kbd style={{ fontSize: "10px" }}>&#8984;K</kbd>
        </button>

        <button
          onClick={toggleTheme}
          className="cursor-pointer transition-colors duration-150"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? "\u2600" : "\u263D"}
        </button>
      </div>
    </header>
  );
}
