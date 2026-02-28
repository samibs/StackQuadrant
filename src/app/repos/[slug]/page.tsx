import type { Metadata } from "next";
import { getRepoBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { ScoreBar } from "@/components/visualizations/score-bar";
import { RadarChart } from "@/components/visualizations/radar-chart";
import { Panel } from "@/components/layout/panel";

export const dynamic = "force-dynamic";

function formatStars(n: number | null): string {
  if (!n) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const repo = await getRepoBySlug(slug);
  if (!repo) return {};
  const score = repo.overallScore ? ` — ${repo.overallScore}/10` : "";
  return {
    title: `${repo.name}${score} — AI/LLM Repository Review`,
    description: `${repo.name}: ${repo.description?.slice(0, 150)}. GitHub stars: ${formatStars(repo.githubStars)}.`,
    alternates: { canonical: `/repos/${slug}` },
    openGraph: {
      title: `${repo.name} — Repository Evaluation${score}`,
      description: `Data-driven evaluation of ${repo.name} across 6 quality dimensions.`,
    },
  };
}

export default async function RepoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const repo = await getRepoBySlug(slug);

  if (!repo) {
    notFound();
  }

  const radarScores = repo.scores.map((s) => ({ dimension: s.dimension, score: s.score ?? 0 }));

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Repos", href: "/repos" }, { name: repo.name, href: `/repos/${slug}` }]} />
      <div style={{ padding: "var(--grid-gap)" }}>
        <div style={{ padding: "0 0 var(--space-2)" }}>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Repos", href: "/repos" }, { label: repo.name }]} />
        </div>

        {/* Hero header */}
        <div
          className="flex items-start gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-4)] mb-[var(--grid-gap)]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-[var(--space-2)]">
              <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                {repo.name}
              </h1>
              {repo.category && (
                <span style={{ padding: "1px 6px", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)", borderRadius: "var(--radius-xs)" }}>
                  {repo.category.name}
                </span>
              )}
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "var(--space-2)" }}>
              {repo.description}
            </p>
            <div className="flex flex-wrap gap-[var(--space-3)] mt-[var(--space-3)]">
              <a href={repo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>
                GitHub →
              </a>
              {repo.websiteUrl && (
                <a href={repo.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>
                  Website →
                </a>
              )}
            </div>
          </div>
          {repo.overallScore && (
            <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
              <ScoreRing score={parseFloat(repo.overallScore)} size={64} strokeWidth={5} />
            </div>
          )}
        </div>

        {/* Main content grid */}
        <div className="repo-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--grid-gap)" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--grid-gap)" }}>
            {/* GitHub Stats */}
            <Panel title="GitHub Metrics">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))", gap: "var(--space-3)" }}>
                {[
                  { label: "Stars", value: formatStars(repo.githubStars) },
                  { label: "Forks", value: formatStars(repo.githubForks) },
                  { label: "Open Issues", value: formatStars(repo.githubOpenIssues) },
                  { label: "Watchers", value: formatStars(repo.githubWatchers) },
                  { label: "Contributors", value: formatStars(repo.githubContributors) },
                  { label: "Weekly Commits", value: repo.githubWeeklyCommits?.toString() || "—" },
                  { label: "Language", value: repo.language || "—" },
                  { label: "License", value: repo.license || "—" },
                  { label: "Last Commit", value: formatDate(repo.githubLastCommit) },
                  { label: "Created", value: formatDate(repo.githubCreatedAt) },
                  { label: "Latest Release", value: repo.githubLastRelease || "—" },
                  { label: "Release Date", value: formatDate(repo.githubReleaseDate) },
                ].map((stat) => (
                  <div key={stat.label} style={{ padding: "var(--space-2)", background: "var(--bg-elevated)", borderRadius: "var(--radius-xs)" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>
                      {stat.label}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              {repo.githubSyncedAt && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "var(--space-2)", textAlign: "right" }}>
                  Synced: {formatDate(repo.githubSyncedAt)}
                </div>
              )}
            </Panel>

            {/* Dimension Scores */}
            <Panel title="Quality Scores">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {repo.scores.map((s) => (
                  <div key={s.dimensionSlug}>
                    <div className="flex items-center justify-between mb-[2px]">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
                        {s.dimension}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                        w: {(s.dimensionWeight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <ScoreBar score={s.score ?? 0} maxScore={10} />
                    {s.evidence && (
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", lineHeight: 1.4 }}>
                        {s.evidence}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Tags */}
            {repo.tags && (repo.tags as string[]).length > 0 && (
              <Panel title="Tags">
                <div className="flex flex-wrap gap-[var(--space-1)]">
                  {(repo.tags as string[]).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "2px 8px",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-muted)",
                        background: "var(--bg-elevated)",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* Right column — Radar */}
          <div>
            <Panel title="Radar">
              {radarScores.some((s) => s.score > 0) ? (
                <RadarChart scores={radarScores} size={260} />
              ) : (
                <div className="flex items-center justify-center py-[var(--space-4)]">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    No scores yet
                  </span>
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
