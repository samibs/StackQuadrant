import type { Metadata } from "next";
import { getPublishedShowcaseProjects } from "@/lib/db/queries";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vibe Coding Showcase — Projects Built with AI",
  description: "Discover projects built with AI-assisted coding tools. Community-submitted, quality-scored showcase of vibe-coded applications.",
  alternates: { canonical: "/showcase" },
};

export default async function ShowcasePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  const data = await getPublishedShowcaseProjects({ page, pageSize: 12 });
  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Showcase", href: "/showcase" }]} />
      <div style={{ padding: "var(--grid-gap)" }}>
        <div style={{ padding: "0 0 var(--space-2)" }}>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Showcase" }]} />
        </div>

        <div
          className="flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] mb-[var(--grid-gap)]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
        >
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            Vibe Coding Showcase
          </h1>
          <div className="flex items-center gap-[var(--space-2)]">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              {data.total} projects
            </span>
            <Link
              href="/showcase/submit"
              style={{
                padding: "4px 12px",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--bg-base)",
                background: "var(--accent-primary)",
                borderRadius: "var(--radius-xs)",
                textDecoration: "none",
              }}
            >
              Submit Project
            </Link>
          </div>
        </div>

        {data.projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[64px]" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>No showcase projects yet.</p>
            <Link
              href="/showcase/submit"
              style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-primary)" }}
            >
              Be the first to submit →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: "var(--grid-gap)" }}>
            {data.projects.map((project) => (
              <Link
                key={project.id}
                href={`/showcase/${project.slug}`}
                className="no-underline"
                style={{ display: "block", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}
              >
                {project.screenshotUrl && (
                  <div style={{ width: "100%", height: "160px", background: "var(--bg-elevated)", overflow: "hidden" }}>
                    <img
                      src={project.screenshotUrl}
                      alt={project.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
                <div style={{ padding: "var(--space-3)" }}>
                  <div className="flex items-start justify-between">
                    <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {project.name}
                    </h2>
                    {project.qualityScore && (
                      <span style={{
                        padding: "1px 6px",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: parseFloat(project.qualityScore) >= 7 ? "var(--status-success)" : "var(--text-muted)",
                        background: "var(--bg-elevated)",
                        borderRadius: "var(--radius-xs)",
                      }}>
                        {project.qualityScore}
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "var(--space-1)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {project.description}
                  </p>
                  {/* AI tool badges */}
                  {"linkedTools" in project && (project as typeof project & { linkedTools: Array<{ toolSlug: string; toolName: string }> }).linkedTools.length > 0 && (
                    <div className="flex flex-wrap gap-[var(--space-1)] mt-[var(--space-2)]">
                      {(project as typeof project & { linkedTools: Array<{ toolSlug: string; toolName: string }> }).linkedTools.map((t) => (
                        <span
                          key={t.toolSlug}
                          style={{
                            padding: "1px 6px",
                            fontSize: "9px",
                            fontFamily: "var(--font-mono)",
                            color: "var(--accent-primary)",
                            border: "1px solid var(--accent-primary)",
                            borderRadius: "var(--radius-xs)",
                          }}
                        >
                          {t.toolName}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-[var(--space-2)] mt-[var(--space-2)]">
                    {project.timeToBuild && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                        {project.timeToBuild}
                      </span>
                    )}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      by {project.builderName}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-[var(--space-2)] mt-[var(--grid-gap)]">
            {page > 1 && (
              <Link href={`/showcase?page=${page - 1}`} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>← prev</Link>
            )}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>{page} / {totalPages}</span>
            {page < totalPages && (
              <Link href={`/showcase?page=${page + 1}`} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>next →</Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
