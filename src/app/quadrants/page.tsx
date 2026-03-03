import { getPublishedQuadrants } from "@/lib/db/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quadrants",
  description: "Magic Quadrant-style charts positioning AI coding tools as Leaders, Visionaries, Challengers, or Niche Players based on execution ability and vision completeness.",
  alternates: { canonical: "/quadrants" },
};

export default async function QuadrantsPage() {
  let quadrants: Awaited<ReturnType<typeof getPublishedQuadrants>> = [];
  try {
    quadrants = await getPublishedQuadrants();
  } catch {}

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      <div
        className="flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] mb-[var(--grid-gap)]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          Capability Quadrants
        </h1>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
          {quadrants.length} published
        </span>
      </div>

      {quadrants.length === 0 ? (
        <div
          className="flex items-center justify-center py-[64px] empty-state-wide"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", minHeight: "30vh" }}
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>
            No quadrants published yet.
          </p>
        </div>
      ) : (
        <div className="card-grid-wide" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: "var(--grid-gap)" }}>
          {quadrants.map((q) => (
            <Link
              key={q.id}
              href={`/quadrants/${q.slug}`}
              className="no-underline transition-colors duration-150"
              style={{
                display: "block",
                padding: "var(--space-4)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                {q.title}
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>
                {q.description}
              </p>
              <div className="flex gap-[var(--space-4)] mt-[var(--space-3)]">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                  X: {q.xAxisLabel}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Y: {q.yAxisLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
