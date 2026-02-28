import { getPublishedBenchmarks } from "@/lib/db/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Benchmarks",
  description: "Real-world benchmark results for AI coding tools. Structured tests covering code generation, debugging, refactoring, context handling, and test generation quality.",
  alternates: { canonical: "/benchmarks" },
};

export default async function BenchmarksPage() {
  let benchmarkList: Awaited<ReturnType<typeof getPublishedBenchmarks>> = [];
  try {
    benchmarkList = await getPublishedBenchmarks();
  } catch {}

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      <div
        className="flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          AI Developer Benchmarks
        </h1>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
          {benchmarkList.length} benchmarks
        </span>
      </div>

      {benchmarkList.length === 0 ? (
        <div className="flex items-center justify-center py-[64px]" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>No benchmarks published yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--grid-gap)" }}>
          {benchmarkList.map((b) => (
            <Link
              key={b.id}
              href={`/benchmarks/${b.slug}`}
              className="no-underline"
              style={{ display: "block", padding: "var(--space-4)", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
            >
              <div className="flex items-center justify-between">
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {b.title}
                </h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "2px 6px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}>
                  {b.category}
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "var(--space-2)", lineHeight: "1.5" }}>
                {b.description.substring(0, 150)}...
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
