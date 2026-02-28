import type { Metadata } from "next";
import { getPublishedRepos, getRepoCategories } from "@/lib/db/queries";
import Link from "next/link";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Panel } from "@/components/layout/panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI/LLM Ecosystem Directory — Repository Ratings",
  description: "Data-driven evaluations of AI and LLM open-source repositories: frameworks, agents, RAG libraries, vector databases, and more. Scored across Documentation, Community Health, Maintenance, API Design, Production Readiness, and Ecosystem Integration.",
  alternates: { canonical: "/repos" },
};

function formatStars(n: number | null): string {
  if (!n) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default async function ReposPage({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; category?: string; search?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const sort = sp.sort || "-stars";
  const category = sp.category || "";
  const search = sp.search || "";

  const [data, categories] = await Promise.all([
    getPublishedRepos({ page, pageSize: 48, sort, category, search }),
    getRepoCategories(),
  ]);

  const totalPages = Math.ceil(data.total / data.pageSize);

  // Group repos by category for the sidebar
  const categoryStats = categories.map((cat) => ({
    ...cat,
    active: category === cat.slug,
  }));

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Repos", href: "/repos" }]} />
      <div style={{ padding: "var(--grid-gap)", height: "calc(100vh - var(--header-height))", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 0 var(--space-2)" }}>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Repos" }]} />
        </div>

        {/* Main layout: sidebar + content */}
        <div className="repos-page-layout" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "var(--grid-gap)", flex: 1, minHeight: 0 }}>
          {/* Left sidebar — categories */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--grid-gap)", overflow: "auto" }}>
            <Panel title={`Directory (${data.total})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <Link
                  href="/repos"
                  className="no-underline"
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "4px 8px", borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    background: !category ? "var(--accent-primary)" : "transparent",
                    color: !category ? "var(--bg-root)" : "var(--text-secondary)",
                  }}
                >
                  <span>All Repos</span>
                  <span style={{ fontSize: "10px", color: !category ? "var(--bg-root)" : "var(--text-muted)" }}>{data.total}</span>
                </Link>
                {categoryStats.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/repos?category=${cat.slug}${sort !== "-stars" ? `&sort=${sort}` : ""}${search ? `&search=${search}` : ""}`}
                    className="no-underline"
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "4px 8px", borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)", fontSize: "11px",
                      background: cat.active ? "var(--accent-primary)" : "transparent",
                      color: cat.active ? "var(--bg-root)" : "var(--text-secondary)",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</span>
                    <span style={{ fontSize: "10px", color: cat.active ? "var(--bg-root)" : "var(--text-muted)", flexShrink: 0 }}>{cat.repoCount}</span>
                  </Link>
                ))}
              </div>
            </Panel>

            {/* Sort controls */}
            <Panel title="Sort By">
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {[
                  { label: "Stars", value: "-stars", icon: "★" },
                  { label: "Score", value: "-overallScore", icon: "◎" },
                  { label: "Name", value: "name", icon: "A" },
                  { label: "Updated", value: "-updated", icon: "↻" },
                ].map((s) => (
                  <Link
                    key={s.value}
                    href={`/repos?sort=${s.value}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                    className="no-underline"
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "4px 8px", borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)", fontSize: "11px",
                      background: sort === s.value ? "var(--accent-primary)" : "transparent",
                      color: sort === s.value ? "var(--bg-root)" : "var(--text-secondary)",
                    }}
                  >
                    <span style={{ width: "14px", textAlign: "center", fontSize: "10px" }}>{s.icon}</span>
                    {s.label}
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          {/* Right content — repo grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--grid-gap)", overflow: "auto", minHeight: 0 }}>
            {data.repos.length === 0 ? (
              <div className="flex items-center justify-center py-[64px]" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>No repositories found.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: "var(--grid-gap)", alignContent: "start" }}>
                {data.repos.map((repo) => {
                  const isOwned = repo.githubOwner === "samibs";
                  return (
                    <Link
                      key={repo.id}
                      href={`/repos/${repo.slug}`}
                      className="no-underline"
                      style={{
                        display: "block",
                        padding: "var(--space-3)",
                        background: isOwned ? "var(--bg-owned)" : "var(--bg-surface)",
                        border: `1px solid ${isOwned ? "var(--accent-owned-dim)" : "var(--border-default)"}`,
                        borderRadius: "var(--radius-sm)",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between" style={{ gap: "var(--space-2)" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h2 style={{
                            fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600,
                            color: isOwned ? "var(--accent-owned)" : "var(--text-primary)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {typeof repo.name === "string" && repo.name.includes("/") ? repo.name.split("/").pop() : repo.name}
                          </h2>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>
                            {repo.githubOwner}/{repo.githubRepo}
                          </div>
                        </div>
                        {repo.overallScore && (
                          <div style={{ width: "32px", height: "32px", flexShrink: 0 }}>
                            <ScoreRing score={parseFloat(repo.overallScore)} size={32} strokeWidth={2.5} />
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p style={{
                        fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-secondary)",
                        marginTop: "var(--space-1)", lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {repo.description}
                      </p>

                      {/* Category badge */}
                      {repo.category && (
                        <div style={{ marginTop: "var(--space-2)" }}>
                          <span style={{
                            fontFamily: "var(--font-mono)", fontSize: "9px",
                            padding: "1px 6px", borderRadius: "var(--radius-sm)",
                            background: "var(--bg-elevated)", color: "var(--accent-primary)",
                            border: "1px solid var(--border-default)",
                          }}>
                            {repo.category.name}
                          </span>
                        </div>
                      )}

                      {/* Stats strip */}
                      <div className="flex flex-wrap gap-x-[var(--space-2)] gap-y-[2px] mt-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                        <span>★ {formatStars(repo.githubStars)}</span>
                        <span>◇ {formatStars(repo.githubForks)}</span>
                        {repo.language && <span>{repo.language}</span>}
                        {repo.license && <span>{repo.license}</span>}
                        {repo.githubLastCommit && (
                          <span style={{ color: "var(--text-muted)" }}>
                            {formatDate(repo.githubLastCommit)}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-[var(--space-2)]" style={{ padding: "var(--space-3)" }}>
                {page > 1 && (
                  <Link
                    href={`/repos?page=${page - 1}${sort !== "-stars" ? `&sort=${sort}` : ""}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}
                  >
                    ← prev
                  </Link>
                )}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/repos?page=${page + 1}${sort !== "-stars" ? `&sort=${sort}` : ""}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}
                  >
                    next →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
