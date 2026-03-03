"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";

const NAV_ITEMS = [
  { label: "MATRIX", href: "/matrix", premium: false },
  { label: "QUADRANTS", href: "/quadrants", premium: false },
  { label: "BENCHMARKS", href: "/benchmarks", premium: false },
  { label: "STACKS", href: "/stacks", premium: false },
  { label: "REPOS", href: "/repos", premium: false },
  { label: "SHOWCASE", href: "/showcase", premium: false },
  { label: "PAINGAPS", href: "/scans", premium: true },
  { label: "FINSERV", href: "/intelligence", premium: true },
  { label: "COMPARE", href: "/compare", premium: false },
  { label: "BLOG", href: "/blog", premium: false },
] as const;

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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

          <nav className="desktop-nav flex items-center gap-[var(--space-1)] ml-[var(--space-4)]">
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
                  <span className="flex items-center gap-1">
                    {item.label}
                    {item.premium && (
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <rect x="3" y="7" width="10" height="8" rx="1.5" fill="#d4a017" />
                        <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#d4a017" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
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

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn cursor-pointer items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: "4px 6px",
              borderRadius: "var(--radius-sm)",
              background: mobileMenuOpen ? "var(--bg-elevated)" : "transparent",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              fontSize: "16px",
              lineHeight: 1,
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? "\u2715" : "\u2630"}
          </button>
        </div>
      </header>

      {/* Mobile navigation overlay */}
      {mobileMenuOpen && (
        <nav
          className="mobile-nav fixed left-0 right-0 z-40 flex-col"
          style={{
            top: "var(--header-height)",
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-default)",
            padding: "var(--space-2) var(--space-3)",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="no-underline block"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "10px var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-elevated)" : "transparent",
                }}
              >
                <span className="flex items-center gap-1">
                  {item.label}
                  {item.premium && (
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <rect x="3" y="7" width="10" height="8" rx="1.5" fill="#d4a017" />
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#d4a017" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
