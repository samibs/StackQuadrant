"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Panel } from "@/components/layout/panel";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { ScoreBar } from "@/components/visualizations/score-bar";
import { Tooltip } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { QuadrantChart } from "@/components/visualizations/quadrant-chart";

interface ToolData {
  id: string;
  name: string;
  slug: string;
  category: string;
  vendor: string | null;
  overallScore: number | null;
  updatedAt: string | Date | null;
  scores: Array<{ dimension: string; dimensionSlug: string; score: number | null }>;
}

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAt: Date | null;
}

interface RecentlyUpdatedTool {
  id: string;
  name: string;
  slug: string;
  overallScore: number | null;
  updatedAt: Date | null;
  category: string;
}

interface FeaturedQuadrant {
  id: string;
  title: string;
  slug: string;
  description: string;
  xAxisLabel: string;
  yAxisLabel: string;
  quadrantLabels: { topRight: string; topLeft: string; bottomRight: string; bottomLeft: string };
  positions: Array<{ toolId: string; toolName: string; toolSlug: string; xPosition: number; yPosition: number }>;
}

interface SiteStats {
  toolCount: number;
  benchmarkCount: number;
  quadrantCount: number;
  lastUpdated: Date | string | null;
}

interface DimensionData {
  id: string;
  name: string;
  slug: string;
  description: string;
  weight: string;
  displayOrder: number;
}

interface RecentScoreChange {
  id: string;
  toolName: string;
  toolSlug: string;
  oldScore: string;
  newScore: string;
  changedAt: Date;
}

interface FeaturedRepo {
  id: string;
  name: string;
  slug: string;
  description: string;
  githubStars: number | null;
  overallScore: string | null;
  category: { name: string; slug: string } | null;
}

interface RecentShowcaseProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  screenshotUrl: string | null;
  builderName: string;
  qualityScore: string | null;
}

interface DashboardProps {
  tools: ToolData[];
  quadrants: Array<{ id: string; title: string; slug: string; description: string }>;
  benchmarks: Array<{ id: string; title: string; slug: string; category: string; topTool: string | null; participantCount: number }>;
  stacks: Array<{ id: string; name: string; slug: string; useCase: string; overallScore: number; metrics: Record<string, number>; tools: Array<{ toolName: string; toolSlug: string; role: string }> }>;
  blogPosts: BlogPostData[];
  recentlyUpdated: RecentlyUpdatedTool[];
  featuredQuadrant: FeaturedQuadrant | null;
  siteStats: SiteStats | null;
  dimensions: DimensionData[];
  recentScoreChanges: RecentScoreChange[];
  featuredRepos: FeaturedRepo[];
  recentShowcase: RecentShowcaseProject[];
}

export function DashboardClient({ tools, quadrants, benchmarks, stacks, blogPosts, recentlyUpdated, featuredQuadrant, siteStats, dimensions, recentScoreChanges, featuredRepos, recentShowcase }: DashboardProps) {
  const hasData = tools.length > 0 || quadrants.length > 0;
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed");
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (confirmed === "success") setShowBanner(true);
  }, [confirmed]);

  return (
    <div style={{ padding: "var(--grid-gap)", minHeight: "calc(100vh - var(--header-height))", display: "flex", flexDirection: "column" }}>
      {showBanner && (
        <div
          className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-2)]"
          style={{
            background: "rgba(22,163,74,0.1)",
            border: "1px solid rgba(22,163,74,0.3)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--grid-gap)",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--score-high)" }}>
            Subscription confirmed! You'll receive updates on new evaluations and benchmarks.
          </span>
          <button
            onClick={() => setShowBanner(false)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "14px" }}
          >
            x
          </button>
        </div>
      )}
      {/* Hero section — authority messaging */}
      <div
        className="hero-section"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "var(--grid-gap)",
          padding: "var(--space-5) var(--space-4)",
          flexShrink: 0,
        }}
      >
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
          The Independent Benchmark for AI Developer Tools
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)", marginTop: "var(--space-2)", maxWidth: "600px" }}>
          Data-driven evaluations across 6 dimensions. No sponsorships. No pay-to-rank.
        </p>
        {siteStats && (
          <div className="flex items-center gap-[var(--space-4)] mt-[var(--space-3)]" style={{ flexWrap: "wrap" }}>
            <div className="flex items-center gap-[var(--space-1)]">
              <span className="status-dot" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                {siteStats.toolCount}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                tools evaluated
              </span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--border-strong)" }}>|</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{siteStats.benchmarkCount}</span> benchmarks
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--border-strong)" }}>|</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{siteStats.quadrantCount}</span> quadrant analyses
            </div>
            {siteStats.lastUpdated && (
              <>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--border-strong)" }}>|</span>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Updated {new Date(siteStats.lastUpdated).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* How We Score — methodology summary */}
      {dimensions.length > 0 && (
        <div
          className="dimension-badges-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "var(--space-2)",
            marginBottom: "var(--grid-gap)",
          }}
        >
          {dimensions.map((dim) => {
            const weight = dim.weight ? parseFloat(dim.weight) : 1;
            const totalWeight = dimensions.reduce((sum, d) => sum + (d.weight ? parseFloat(d.weight) : 1), 0);
            const pct = ((weight / totalWeight) * 100).toFixed(0);
            return (
              <Tooltip key={dim.id} content={dim.description}>
                <div
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--space-2) var(--space-3)",
                    cursor: "help",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {dim.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {pct}% weight
                  </div>
                </div>
              </Tooltip>
            );
          })}
          <Link
            href="/methodology"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.2)",
              borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3)",
              fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)",
              textDecoration: "none", fontWeight: 500,
            }}
          >
            Full methodology →
          </Link>
        </div>
      )}

      {/* Featured Insight */}
      {hasData && tools.length >= 2 && (
        <FeaturedInsight tools={tools} />
      )}

      {/* Recently Updated strip with trending badges */}
      {(recentlyUpdated.length > 0 || recentScoreChanges.length > 0) && (
        <div
          className="recently-updated-strip flex items-center gap-[var(--space-4)] flex-wrap"
          style={{
            padding: "var(--space-2) var(--space-4)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--grid-gap)",
          }}
        >
          {recentScoreChanges.length > 0 ? (
            <>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                Score Changes
              </span>
              {recentScoreChanges.map((sc) => {
                const oldVal = parseFloat(sc.oldScore);
                const newVal = parseFloat(sc.newScore);
                const delta = newVal - oldVal;
                const isUp = delta > 0;
                return (
                  <Link
                    key={sc.id}
                    href={`/tools/${sc.toolSlug}`}
                    className="flex items-center gap-[var(--space-1)] no-underline"
                  >
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {sc.toolName}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700,
                      color: isUp ? "var(--score-high)" : "var(--score-low)",
                    }}>
                      {isUp ? "▲" : "▼"}{Math.abs(delta).toFixed(1)}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      {oldVal.toFixed(1)}→{newVal.toFixed(1)}
                    </span>
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                Recently Updated
              </span>
              {recentlyUpdated.map((t) => (
                <Link
                  key={t.id}
                  href={`/tools/${t.slug}`}
                  className="flex items-center gap-[var(--space-1)] no-underline"
                >
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {t.name}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700,
                    color: (t.overallScore || 0) >= 8 ? "var(--score-high)" : (t.overallScore || 0) >= 5 ? "var(--score-mid)" : "var(--score-low)",
                  }}>
                    {t.overallScore?.toFixed(1)}
                  </span>
                  {t.updatedAt && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                      {new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      {/* Featured Quadrant — full-width interactive */}
      {featuredQuadrant && featuredQuadrant.positions.length > 0 && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-4)",
            marginBottom: "var(--grid-gap)",
          }}
        >
          <div className="flex items-center justify-between mb-[var(--space-3)]" style={{ flexWrap: "wrap", gap: "var(--space-2)" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {featuredQuadrant.title}
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {featuredQuadrant.positions.length} tools · {featuredQuadrant.xAxisLabel} vs {featuredQuadrant.yAxisLabel}
              </p>
            </div>
            <Link
              href={`/quadrants/${featuredQuadrant.slug}`}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600,
                padding: "6px 14px", background: "var(--accent-primary)", color: "#fff",
                borderRadius: "var(--radius-sm)", textDecoration: "none",
              }}
            >
              Explore full quadrant →
            </Link>
          </div>
          <QuadrantChart
            xAxisLabel={featuredQuadrant.xAxisLabel}
            yAxisLabel={featuredQuadrant.yAxisLabel}
            quadrantLabels={featuredQuadrant.quadrantLabels}
            maxHeight="380px"
            positions={featuredQuadrant.positions.map((p) => ({
              toolId: p.toolId,
              toolName: p.toolName,
              toolSlug: p.toolSlug,
              xPosition: p.xPosition,
              yPosition: p.yPosition,
            }))}
          />
        </div>
      )}

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
          className="dashboard-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "auto auto auto",
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
                        {/* Dimension score bars */}
                        <div className="flex flex-col gap-[2px] mt-1">
                          {tool.scores.filter(s => s.score !== null).map(s => (
                            <div key={s.dimensionSlug} className="flex items-center gap-[4px]">
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-muted)", width: "52px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {s.dimension.replace(/ & /g, "/").replace(/Understanding/, "Ctx").replace(/Integration/, "Int").replace(/Generation/, "Gen").replace(/Experience/, "DX").replace(/Multi-file Editing/, "Multi").replace(/Debugging/, "Debug")}
                              </span>
                              <div style={{ flex: 1, height: "3px", background: "var(--bg-elevated)", borderRadius: "2px", overflow: "hidden", maxWidth: "60px" }}>
                                <div style={{
                                  width: `${((s.score || 0) / 10) * 100}%`,
                                  height: "100%",
                                  borderRadius: "2px",
                                  background: (s.score || 0) >= 8 ? "var(--score-high)" : (s.score || 0) >= 5 ? "var(--score-mid)" : "var(--score-low)",
                                }} />
                              </div>
                              <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "8px", fontWeight: 600, width: "18px", textAlign: "right",
                                color: (s.score || 0) >= 8 ? "var(--score-high)" : (s.score || 0) >= 5 ? "var(--score-mid)" : "var(--score-low)"
                              }}>{s.score?.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="relative" style={{ width: "44px", height: "44px" }}>
                          <ScoreRing score={tool.overallScore || 0} size={44} strokeWidth={3} tooltip="Overall score (0-10) based on weighted evaluation across 6 dimensions" />
                        </div>
                        {tool.updatedAt && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-muted)" }}>
                            {new Date(tool.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Quadrants — compact panel linking to full-page view */}
          <Panel title="Quadrants" actions={<Link href="/quadrants" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>View all &rarr;</Link>}>
            <div className="flex flex-col gap-[var(--space-2)]">
              {quadrants.length === 0 ? (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>No quadrants published yet</p>
              ) : (
                quadrants.slice(0, 3).map((q) => (
                  <Link key={q.id} href={`/quadrants/${q.slug}`} className="no-underline p-[var(--space-2)]" style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", display: "block" }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{q.title}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{q.description.substring(0, 80)}...</div>
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
                    className="no-underline p-[var(--space-2)] transition-colors duration-150"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div className="flex items-center justify-between">
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
                    </div>
                    {b.topTool && (
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--score-high)", marginTop: "4px" }}>
                        Top performer: {b.topTool} ({b.participantCount} tools tested)
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </Panel>

          {/* Best For... Recommendations */}
          <Panel title="Best For..." actions={<Link href="/compare" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>Compare &rarr;</Link>}>
            <div className="flex flex-col gap-[var(--space-2)]">
              {[
                { label: "Terminal power users", tool: "Claude Code", slug: "claude-code", why: "Agentic CLI with full codebase context" },
                { label: "IDE-first workflow", tool: "Cursor", slug: "cursor", why: "VS Code fork with Composer mode" },
                { label: "Multi-editor teams", tool: "GitHub Copilot", slug: "github-copilot", why: "Works across VS Code, JetBrains, Neovim" },
                { label: "Open source projects", tool: "Aider", slug: "aider", why: "Apache-2.0, BYOK, git-integrated" },
                { label: "Enterprise & compliance", tool: "Tabnine", slug: "tabnine", why: "Privacy-focused, on-premise option" },
                { label: "Beginners", tool: "Replit Agent", slug: "replit-agent", why: "Full-stack cloud IDE, no setup" },
              ].map((rec) => (
                <Link
                  key={rec.slug}
                  href={`/tools/${rec.slug}`}
                  className="flex items-start gap-[var(--space-2)] no-underline p-[var(--space-2)]"
                  style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {rec.label}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {rec.tool}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {rec.why}
                    </div>
                  </div>
                </Link>
              ))}
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
                    {s.tools && s.tools.length > 0 && (
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {s.tools.map((t) => t.toolName).join(" + ")}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </Panel>

          {/* Featured Repos */}
          {featuredRepos.length > 0 && (
            <Panel title="Featured Repos" actions={<Link href="/repos" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>All repos &rarr;</Link>}>
              <div className="flex flex-col gap-[var(--space-2)]">
                {featuredRepos.map((repo) => (
                  <Link
                    key={repo.id}
                    href={`/repos/${repo.slug}`}
                    className="no-underline p-[var(--space-2)]"
                    style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {repo.name}
                        </div>
                        {repo.category && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent-primary)" }}>
                            {repo.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-[var(--space-2)]">
                        {repo.githubStars !== null && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                            ★ {repo.githubStars >= 1000 ? `${(repo.githubStars / 1000).toFixed(1)}k` : repo.githubStars}
                          </span>
                        )}
                        {repo.overallScore && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--status-success)" }}>
                            {repo.overallScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          {/* Latest Showcase Projects */}
          {recentShowcase.length > 0 && (
            <Panel title="Vibe Coded Projects" actions={<Link href="/showcase" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>All projects &rarr;</Link>}>
              <div className="flex flex-col gap-[var(--space-2)]">
                {recentShowcase.map((project) => (
                  <Link
                    key={project.id}
                    href={`/showcase/${project.slug}`}
                    className="no-underline p-[var(--space-2)]"
                    style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {project.name}
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                          by {project.builderName}
                        </span>
                      </div>
                      {project.qualityScore && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: parseFloat(project.qualityScore) >= 7 ? "var(--status-success)" : "var(--text-muted)" }}>
                          {project.qualityScore}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          {/* Latest from Blog */}
          {blogPosts.length > 0 && (
            <Panel title="Latest from Blog" actions={<Link href="/blog" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>All articles &rarr;</Link>}>
              <div className="flex flex-col gap-[var(--space-2)]">
                {blogPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="no-underline p-[var(--space-2)]"
                    style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
                  >
                    <div className="flex items-center gap-[var(--space-2)]">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", padding: "1px 5px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        {post.category}
                      </span>
                      {post.publishedAt && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                          {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>
                      {post.title}
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          )}

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
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    setStatus("sending");
    try {
      const res = await fetch("/api/v1/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        form.reset();
        setStatus("sent");
      } else {
        const data = await res.json();
        if (res.status === 409) {
          setStatus("sent");
        } else {
          setStatus("error");
        }
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--score-high)", padding: "var(--space-2)" }}>
        Check your email to confirm your subscription.
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", marginBottom: "var(--space-1)", fontWeight: 600 }}>
        The AI tools landscape shifts weekly. We track it so you don&apos;t have to.
      </p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
        Biweekly updates on new evaluations, score changes, and benchmark results.
      </p>
      {status === "error" && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--score-low)", marginBottom: "var(--space-2)" }}>
          Something went wrong. Please try again.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-[var(--space-2)]">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          placeholder="you@company.com"
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
          disabled={status === "sending"}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 16px",
            background: "var(--accent-primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            cursor: status === "sending" ? "wait" : "pointer",
            opacity: status === "sending" ? 0.7 : 1,
          }}
        >
          {status === "sending" ? "Sending..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
}

function MiniQuadrantChart({ positions, quadrantLabels }: { positions: Array<{ toolName: string; xPosition: number; yPosition: number }>; quadrantLabels: { topRight: string; topLeft: string; bottomRight: string; bottomLeft: string } }) {
  const size = 200;
  const pad = 4;
  const plotSize = size - pad * 2;
  const mid = size / 2;

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Quadrant chart showing ${positions.length} tools across 4 quadrants`} style={{ maxWidth: size, display: "block", margin: "0 auto" }}>
      {/* Quadrant backgrounds */}
      <rect x={pad} y={pad} width={plotSize / 2} height={plotSize / 2} fill="rgba(234,179,8,0.06)" />
      <rect x={mid} y={pad} width={plotSize / 2} height={plotSize / 2} fill="rgba(22,163,74,0.06)" />
      <rect x={pad} y={mid} width={plotSize / 2} height={plotSize / 2} fill="rgba(239,68,68,0.06)" />
      <rect x={mid} y={mid} width={plotSize / 2} height={plotSize / 2} fill="rgba(59,130,246,0.06)" />
      {/* Crosshair */}
      <line x1={mid} y1={pad} x2={mid} y2={size - pad} stroke="var(--border-default)" strokeWidth={0.5} />
      <line x1={pad} y1={mid} x2={size - pad} y2={mid} stroke="var(--border-default)" strokeWidth={0.5} />
      {/* Quadrant labels */}
      <text x={pad + 4} y={pad + 12} fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono)">{quadrantLabels.topLeft}</text>
      <text x={size - pad - 4} y={pad + 12} fill="var(--score-high)" fontSize="7" fontFamily="var(--font-mono)" textAnchor="end">{quadrantLabels.topRight}</text>
      <text x={pad + 4} y={size - pad - 4} fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono)">{quadrantLabels.bottomLeft}</text>
      <text x={size - pad - 4} y={size - pad - 4} fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono)" textAnchor="end">{quadrantLabels.bottomRight}</text>
      {/* Tool dots */}
      {positions.map((p, i) => {
        const cx = pad + (p.xPosition / 100) * plotSize;
        const cy = pad + ((100 - p.yPosition) / 100) * plotSize;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={3.5} fill="var(--accent-primary)" opacity={0.8} />
            <text x={cx + 5} y={cy + 3} fill="var(--text-secondary)" fontSize="6.5" fontFamily="var(--font-mono)">
              {p.toolName.length > 12 ? p.toolName.substring(0, 11) + "…" : p.toolName}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FeaturedInsight({ tools }: { tools: ToolData[] }) {
  if (tools.length < 2) return null;

  const top = tools[0];
  const runner = tools[1];

  // Find dimension where runner-up beats the leader
  const runnerWins = runner.scores.filter((rs) => {
    const topScore = top.scores.find((ts) => ts.dimensionSlug === rs.dimensionSlug);
    return rs.score !== null && topScore != null && topScore.score !== null && rs.score > topScore.score;
  });

  const insightDim = runnerWins.length > 0 ? runnerWins[0] : null;

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--space-3) var(--space-4)",
        marginBottom: "var(--grid-gap)",
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-1)" }}>
        Featured Insight
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", lineHeight: "1.5" }}>
        {top.name} leads overall at {top.overallScore?.toFixed(1)}/10
        {insightDim && (
          <>, but {runner.name} edges ahead in {insightDim.dimension} ({insightDim.score?.toFixed(1)} vs {top.scores.find((s) => s.dimensionSlug === insightDim.dimensionSlug)?.score?.toFixed(1)})</>
        )}
        {!insightDim && runner.overallScore && (
          <>, with {runner.name} close behind at {runner.overallScore.toFixed(1)}/10</>
        )}
        .
      </div>
      <div className="flex items-center gap-[var(--space-3)] mt-[var(--space-2)]">
        <Link href={`/compare?tools=${top.slug},${runner.slug}`} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)", textDecoration: "none" }}>
          Compare {top.name} vs {runner.name} &rarr;
        </Link>
        <Link href="/matrix" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>
          Full rankings &rarr;
        </Link>
      </div>
    </div>
  );
}
