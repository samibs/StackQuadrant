import Link from "next/link";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-default)",
        padding: "var(--space-5) var(--space-6)",
        marginTop: "var(--space-8)",
      }}
    >
      <div
        style={{ maxWidth: "1200px", margin: "0 auto" }}
        className="wide-container flex flex-col gap-[var(--space-4)]"
      >
        <div className="footer-columns flex flex-wrap justify-between gap-[var(--space-6)]">
          <div>
            <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-2)]">
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--accent-primary)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "0.08em",
                }}
              >
                STACKQUADRANT
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", maxWidth: "280px" }}>
              Data-driven evaluations of AI coding tools across 6 dimensions with real benchmarks.
            </p>
          </div>

          <div className="flex gap-[var(--space-6)]">
            <div>
              <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)" }}>
                Explore
              </h4>
              <nav className="flex flex-col gap-[var(--space-1)]">
                {[
                  { href: "/matrix", label: "Matrix" },
                  { href: "/quadrants", label: "Quadrants" },
                  { href: "/benchmarks", label: "Benchmarks" },
                  { href: "/stacks", label: "Stacks" },
                  { href: "/compare", label: "Compare" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", textDecoration: "none" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)" }}>
                Resources
              </h4>
              <nav className="flex flex-col gap-[var(--space-1)]">
                {[
                  { href: "/methodology", label: "Methodology" },
                  { href: "/blog", label: "Blog" },
                  { href: "/help", label: "Help" },
                  { href: "/api/v1/tools", label: "API" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", textDecoration: "none" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border-default)",
            paddingTop: "var(--space-3)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-muted)",
          }}
          className="flex flex-wrap justify-between gap-[var(--space-2)]"
        >
          <span>&copy; {new Date().getFullYear()} StackQuadrant. All rights reserved.</span>
          <span>Data current as of {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}. Evaluations updated quarterly. Not affiliated with Gartner.</span>
        </div>
      </div>
    </footer>
  );
}
