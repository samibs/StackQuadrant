import type { Metadata } from "next";
import { getShowcaseByTool } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ toolSlug: string }> }): Promise<Metadata> {
  const { toolSlug } = await params;
  const data = await getShowcaseByTool(toolSlug);
  if (!data.tool) return {};
  return {
    title: `Built with ${data.tool.name} — Vibe Coding Showcase`,
    description: `Projects built using ${data.tool.name}. ${data.projects.length} community-submitted AI-coded applications.`,
    alternates: { canonical: `/built-with/${toolSlug}` },
  };
}

export default async function BuiltWithPage({ params }: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await params;
  const data = await getShowcaseByTool(toolSlug);

  if (!data.tool) {
    notFound();
  }

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Showcase", href: "/showcase" }, { name: `Built with ${data.tool.name}`, href: `/built-with/${toolSlug}` }]} />
      <div style={{ padding: "var(--grid-gap)" }}>
        <div style={{ padding: "0 0 var(--space-2)" }}>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Showcase", href: "/showcase" }, { label: `Built with ${data.tool.name}` }]} />
        </div>

        <div
          className="flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] mb-[var(--grid-gap)]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
        >
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            Built with {data.tool.name}
          </h1>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            {data.projects.length} projects
          </span>
        </div>

        {data.projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[64px]" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
              No projects built with {data.tool.name} yet.
            </p>
            <Link href="/showcase/submit" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-primary)" }}>
              Submit yours →
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
                    <img src={project.screenshotUrl} alt={project.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div style={{ padding: "var(--space-3)" }}>
                  <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {project.name}
                  </h2>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "var(--space-1)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {project.description}
                  </p>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "var(--space-2)", display: "block" }}>
                    by {project.builderName}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
