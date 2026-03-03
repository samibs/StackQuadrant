import type { Metadata } from "next";
import { getShowcaseBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Panel } from "@/components/layout/panel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getShowcaseBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.name} — Vibe Coding Showcase`,
    description: `${project.name}: ${project.description?.slice(0, 150)}. Built by ${project.builderName}.`,
    alternates: { canonical: `/showcase/${slug}` },
  };
}

export default async function ShowcaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getShowcaseBySlug(slug);

  if (!project || project.status !== "published") {
    notFound();
  }

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Showcase", href: "/showcase" }, { name: project.name, href: `/showcase/${slug}` }]} />
      <div style={{ padding: "var(--grid-gap)" }}>
        <div style={{ padding: "0 0 var(--space-2)" }}>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Showcase", href: "/showcase" }, { label: project.name }]} />
        </div>

        {/* Screenshot */}
        {project.screenshotUrl && (
          <div
            style={{ width: "100%", maxHeight: "400px", overflow: "hidden", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", marginBottom: "var(--grid-gap)" }}
          >
            <img
              src={project.screenshotUrl}
              alt={project.name}
              style={{ width: "100%", height: "auto", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Header */}
        <div
          className="px-[var(--space-4)] py-[var(--space-4)] mb-[var(--grid-gap)]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                {project.name}
              </h1>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
                by {project.builderName} {project.timeToBuild && `· ${project.timeToBuild}`}
              </p>
            </div>
            {project.qualityScore && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 700, color: parseFloat(project.qualityScore) >= 7 ? "var(--status-success)" : "var(--text-primary)" }}>
                  {project.qualityScore}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>QUALITY</div>
              </div>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "var(--space-3)" }}>
            {project.description}
          </p>
          <div className="flex flex-wrap gap-[var(--space-3)] mt-[var(--space-3)]">
            {project.projectUrl && (
              <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>
                Live Project →
              </a>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>
                GitHub →
              </a>
            )}
            {project.builderUrl && (
              <a href={project.builderUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}>
                Builder →
              </a>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="showcase-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--grid-gap)" }}>
          {/* AI Tools Used */}
          <Panel title="AI Tools Used">
            {project.linkedTools.length > 0 ? (
              <div className="flex flex-wrap gap-[var(--space-2)]">
                {project.linkedTools.map((t) => (
                  <Link
                    key={t.toolSlug}
                    href={`/tools/${t.toolSlug}`}
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--accent-primary)",
                      border: "1px solid var(--accent-primary)",
                      borderRadius: "var(--radius-xs)",
                      textDecoration: "none",
                    }}
                  >
                    {t.toolName}
                    {t.toolScore && (
                      <span style={{ marginLeft: "4px", fontSize: "9px", opacity: 0.7 }}>{t.toolScore}</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-[var(--space-1)]">
                {(project.aiToolsUsed as string[]).map((slug) => (
                  <span key={slug} style={{ padding: "2px 8px", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", background: "var(--bg-elevated)", borderRadius: "var(--radius-xs)" }}>
                    {slug}
                  </span>
                ))}
              </div>
            )}
          </Panel>

          {/* Tech Stack */}
          <Panel title="Tech Stack">
            <div className="flex flex-wrap gap-[var(--space-1)]">
              {(project.techStack as string[]).map((tech) => (
                <span key={tech} style={{ padding: "2px 8px", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", background: "var(--bg-elevated)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-default)" }}>
                  {tech}
                </span>
              ))}
              {(project.techStack as string[]).length === 0 && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Not specified</span>
              )}
            </div>
          </Panel>

          {/* Quality Breakdown */}
          {project.qualityBreakdown && (
            <Panel title="Quality Breakdown">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {[
                  { label: "Works", score: project.qualityBreakdown.works },
                  { label: "Code Quality", score: project.qualityBreakdown.codeQuality },
                  { label: "Shipped", score: project.qualityBreakdown.shipped },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{item.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: item.score >= 7 ? "var(--status-success)" : "var(--text-primary)" }}>{item.score}/10</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
