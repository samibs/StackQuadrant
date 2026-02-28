import { getPublishedStacks } from "@/lib/db/queries";
import Link from "next/link";
import { ScoreRing } from "@/components/visualizations/score-ring";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stack Ratings",
  description: "Evaluate AI developer tool combinations for real-world workflows. Stack effectiveness scores measure how well tools work together for specific use cases.",
  alternates: { canonical: "/stacks" },
};

export default async function StacksPage() {
  let stackList: Awaited<ReturnType<typeof getPublishedStacks>> = [];
  try {
    stackList = await getPublishedStacks();
  } catch {}

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      <div
        className="flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          AI Developer Stack Ratings
        </h1>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
          {stackList.length} stacks evaluated
        </span>
      </div>

      {stackList.length === 0 ? (
        <div className="flex items-center justify-center py-[64px]" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>No stacks evaluated yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--grid-gap)" }}>
          {stackList.map((stack) => (
            <Link
              key={stack.id}
              href={`/stacks/${stack.slug}`}
              className="no-underline"
              style={{ display: "block", padding: "var(--space-4)", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {stack.name}
                  </h2>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                    {stack.useCase}
                  </span>
                </div>
                <div className="relative" style={{ width: "48px", height: "48px" }}>
                  <ScoreRing score={stack.overallScore} size={48} strokeWidth={4} />
                </div>
              </div>

              <div className="flex flex-wrap gap-[var(--space-1)] mt-[var(--space-3)]">
                {stack.tools.map((t) => (
                  <span
                    key={t.toolId}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 8px",
                      background: "var(--bg-elevated)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t.toolName}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
