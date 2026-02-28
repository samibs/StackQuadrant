"use client";

import Link from "next/link";
import { Panel } from "@/components/layout/panel";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { ScoreBar } from "@/components/visualizations/score-bar";
import { Tooltip } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface ToolData {
  id: string;
  name: string;
  slug: string;
  category: string;
  vendor: string | null;
  overallScore: number | null;
  scores: Array<{ dimension: string; dimensionSlug: string; score: number | null }>;
}

interface DashboardProps {
  tools: ToolData[];
  quadrants: Array<{ id: string; title: string; slug: string; description: string }>;
  benchmarks: Array<{ id: string; title: string; slug: string; category: string }>;
  stacks: Array<{ id: string; name: string; slug: string; useCase: string; overallScore: number; metrics: Record<string, number> }>;
}

export function DashboardClient({ tools, quadrants, benchmarks, stacks }: DashboardProps) {
  const hasData = tools.length > 0 || quadrants.length > 0;

  return (
    <div style={{ padding: "var(--grid-gap)", minHeight: "calc(100vh - var(--header-height))", display: "flex", flexDirection: "column" }}>
      {/* Hero section — minimal, data-focused */}
      <div
        className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "var(--grid-gap)",
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            AI Developer Tool Intelligence
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Data-driven evaluations of AI coding tools, stacks, and workflows
          </p>
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="status-dot" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            {tools.length} tools tracked
          </span>
        </div>
      </div>

      {!hasData ? (
        <div
          className="flex flex-col items-center justify-center flex-1"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--text-secondary)" }}>
            No data available yet. Run the seed script to populate the database.
          </p>
          <code
            className="mt-[var(--space-2)]"
            style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-primary)", padding: "4px 12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}
          >
            npm run db:seed
          </code>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "var(--grid-gap)",
            flex: 1,
          }}
        >
          {/* Top Tools Leaderboard — spans full left column */}
          <div style={{ gridRow: "1 / 3" }}>
            <Panel title="Top Tools" actions={<Link href="/matrix" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>View all &rarr;</Link>}>
              <div className="flex flex-col gap-[var(--space-3)]">
                {tools.slice(0, 10).map((tool, i) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link href={`/tools/${tool.slug}`} className="flex items-center gap-[var(--space-3)] no-underline group">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", width: "20px" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-[var(--space-2)]">
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                            {tool.name}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                            {tool.category}
                          </span>
                        </div>
                        {/* Mini score bars for top 3 dimensions */}
                        {i < 5 && (
                          <div className="flex gap-[var(--space-2)] mt-1">
                            {tool.scores.filter(s => s.score !== null).slice(0, 3).map(s => (
                              <div key={s.dimensionSlug} className="flex items-center gap-1">
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>{s.dimension.split(" ")[0]}</span>
                                <span style={{
                                  fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 600,
                                  color: (s.score || 0) >= 8 ? "var(--score-high)" : (s.score || 0) >= 5 ? "var(--score-mid)" : "var(--score-low)"
                                }}>{s.score?.toFixed(1)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative" style={{ width: "44px", height: "44px" }}>
                        <ScoreRing score={tool.overallScore || 0} size={44} strokeWidth={3} tooltip="Overall score (0-10) based on weighted evaluation across 6 dimensions" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Quadrants */}
          <Panel title="Quadrants" actions={<Link href="/quadrants" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>View all &rarr;</Link>}>
            <div className="flex flex-col gap-[var(--space-2)]">
              {quadrants.length === 0 ? (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>No quadrants published yet</p>
              ) : (
                quadrants.map((q) => (
                  <Link
                    key={q.id}
                    href={`/quadrants/${q.slug}`}
                    className="no-underline p-[var(--space-3)] transition-colors duration-150"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {q.title}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4" }}>
                      {q.description.substring(0, 120)}...
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Panel>

          {/* Latest Benchmarks */}
          <Panel title="Benchmarks" actions={<Link href="/benchmarks" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>View all &rarr;</Link>}>
            <div className="flex flex-col gap-[var(--space-2)]">
              {benchmarks.length === 0 ? (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>No benchmarks published yet</p>
              ) : (
                benchmarks.slice(0, 6).map((b) => (
                  <Link
                    key={b.id}
                    href={`/benchmarks/${b.slug}`}
                    className="flex items-center justify-between no-underline p-[var(--space-2)] transition-colors duration-150"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {b.title}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-elevated)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {b.category}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </Panel>

          {/* Top Stacks */}
          <Panel title="Top Stacks" actions={<Link href="/stacks" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>View all &rarr;</Link>}>
            <div className="flex flex-col gap-[var(--space-3)]">
              {stacks.length === 0 ? (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>No stacks evaluated yet</p>
              ) : (
                stacks.slice(0, 5).map((s) => (
                  <Link key={s.id} href={`/stacks/${s.slug}`} className="no-underline p-[var(--space-2)]" style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {s.name}
                      </span>
                      <Tooltip content="Stack effectiveness score (0-10). Evaluates how well these tools work together for the target use case.">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: s.overallScore >= 8 ? "var(--score-high)" : "var(--score-mid)", cursor: "help" }}>
                          {s.overallScore.toFixed(1)}
                        </span>
                      </Tooltip>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {s.useCase}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Panel>

          {/* Newsletter */}
          <Panel title="Stay Updated">
            <NewsletterForm />
          </Panel>
        </div>
      )}
    </div>
  );
}

function NewsletterForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    const res = await fetch("/api/v1/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      form.reset();
      alert("Check your email to confirm your subscription.");
    }
  };

  return (
    <div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "var(--space-3)" }}>
        Get notified when we publish new evaluations and benchmarks.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-[var(--space-2)]">
        <input
          name="email"
          type="email"
          placeholder="developer@example.com"
          required
          style={{
            flex: 1,
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            padding: "6px 12px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 16px",
            background: "var(--accent-primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
