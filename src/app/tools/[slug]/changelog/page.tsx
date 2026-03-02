import type { Metadata } from "next";
import { getToolBySlug, getToolChangelog } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CHANGE_TYPE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  added: { label: "Added", bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  quadrant_move: { label: "Moved", bg: "rgba(14,165,233,0.15)", color: "#0ea5e9" },
  metadata_update: { label: "Updated", bg: "rgba(234,179,8,0.15)", color: "#eab308" },
  score_change: { label: "Score", bg: "rgba(168,85,247,0.15)", color: "#a855f7" },
  discontinued: { label: "Discontinued", bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  merged: { label: "Merged", bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return {};
  return {
    title: `${tool.name} — Change History`,
    description: `History of changes and corrections to ${tool.name} data on StackQuadrant, contributed by the community.`,
    alternates: { canonical: `/tools/${slug}/changelog` },
    openGraph: {
      title: `${tool.name} — Change History`,
      description: `Community-contributed changes to ${tool.name} on StackQuadrant.`,
    },
  };
}

export default async function ToolChangelogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const changelog = await getToolChangelog(slug);

  return (
    <div style={{ padding: "var(--grid-gap)", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <div className="flex items-center gap-[var(--space-3)]">
          <Link href={`/tools/${slug}`} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>
            {tool.name.toUpperCase()}
          </Link>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.05em" }}>
            CHANGE HISTORY
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            ({changelog.length})
          </span>
        </div>
      </div>

      {/* Timeline */}
      {changelog.length === 0 ? (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
            No changes recorded yet.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            Be the first to suggest a correction for {tool.name}.
          </p>
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: "24px" }}>
          {/* Vertical timeline line */}
          <div style={{
            position: "absolute",
            left: "7px",
            top: "8px",
            bottom: "8px",
            width: "2px",
            background: "var(--border-default)",
          }} />

          {changelog.map((entry, i) => {
            const badge = CHANGE_TYPE_BADGES[entry.changeType] || CHANGE_TYPE_BADGES.metadata_update;
            const details = entry.details as { field?: string; oldValue?: unknown; newValue?: unknown } | null;
            const evidenceLinks = (entry.evidenceLinks || []) as string[];

            return (
              <div key={entry.id} style={{ position: "relative", marginBottom: i < changelog.length - 1 ? "24px" : "0" }}>
                {/* Timeline dot */}
                <div style={{
                  position: "absolute",
                  left: "-21px",
                  top: "8px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: badge.color,
                  border: "2px solid var(--bg-base)",
                }} />

                <div style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  padding: "16px 20px",
                }}>
                  {/* Date + Type */}
                  <div className="flex items-center gap-[var(--space-3)]" style={{ marginBottom: "8px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      background: badge.bg,
                      color: badge.color,
                      fontWeight: 600,
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  {/* Summary */}
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.6", marginBottom: "8px" }}>
                    {entry.summary}
                  </p>

                  {/* Details */}
                  {details?.field && (
                    <div style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--text-secondary)",
                      background: "var(--bg-elevated)",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "8px",
                    }}>
                      <span style={{ color: "var(--text-muted)" }}>Field: </span>{details.field}
                      {details.oldValue !== undefined && (
                        <span><span style={{ color: "var(--text-muted)" }}> | Old: </span>{String(details.oldValue)}</span>
                      )}
                      {details.newValue !== undefined && (
                        <span><span style={{ color: "var(--text-muted)" }}> | New: </span>{String(details.newValue)}</span>
                      )}
                    </div>
                  )}

                  {/* Evidence links */}
                  {evidenceLinks.length > 0 && (
                    <div className="flex gap-[var(--space-2)]" style={{ marginBottom: "8px" }}>
                      {evidenceLinks.map((link, j) => (
                        <a
                          key={j}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-primary)", textDecoration: "none" }}
                        >
                          Evidence {j + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Attribution */}
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                    {entry.suggestedBy ? (
                      <span>Suggested by <span style={{ color: "var(--text-secondary)" }}>{entry.suggestedBy}</span></span>
                    ) : (
                      <span>Anonymous contribution</span>
                    )}
                    <span style={{ margin: "0 8px" }}>|</span>
                    Approved by <span style={{ color: "var(--text-secondary)" }}>{entry.approvedBy}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Back link */}
      <div style={{ marginTop: "var(--grid-gap)", textAlign: "center" }}>
        <Link
          href={`/tools/${slug}`}
          style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)", textDecoration: "none" }}
        >
          Back to {tool.name}
        </Link>
      </div>
    </div>
  );
}
