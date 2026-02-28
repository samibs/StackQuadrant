import { getBenchmarkBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { InfoIcon } from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

export default async function BenchmarkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const benchmark = await getBenchmarkBySlug(slug);

  if (!benchmark) {
    notFound();
  }

  const metrics = benchmark.metrics as Array<{ name: string; unit: string; higherIsBetter: boolean }>;

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      {/* Header */}
      <div
        className="px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <div className="flex items-center gap-[var(--space-2)]">
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
            {benchmark.title}
          </h1>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}>
            {benchmark.category}
          </span>
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>
          {benchmark.description}
        </p>
      </div>

      {/* Methodology */}
      <div
        className="px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-2)" }}>
          Methodology
        </h2>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.6" }}>
          {benchmark.methodology}
        </p>
      </div>

      {/* Results table */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>
                Tool
              </th>
              {metrics.map((m) => (
                <th key={m.name} style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  <span className="inline-flex items-center justify-end gap-1">
                    {m.name} ({m.unit})
                    <InfoIcon tip={m.higherIsBetter ? "Higher is better" : "Lower is better"} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {benchmark.results.map((r) => (
              <tr key={r.toolId} style={{ borderBottom: "1px solid var(--border-default)" }}>
                <td style={{ padding: "8px 12px" }}>
                  <Link href={`/tools/${r.toolSlug}`} style={{ fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--text-primary)" }}>
                    {r.toolName}
                  </Link>
                </td>
                {metrics.map((m) => {
                  const value = r.results[m.name];
                  const allValues = benchmark.results.map((br) => br.results[m.name]).filter(Boolean);
                  const isBest = m.higherIsBetter
                    ? value === Math.max(...allValues)
                    : value === Math.min(...allValues);

                  return (
                    <td
                      key={m.name}
                      style={{
                        padding: "8px 12px",
                        textAlign: "right",
                        fontWeight: isBest ? 700 : 400,
                        color: isBest ? "var(--score-high)" : "var(--text-primary)",
                      }}
                    >
                      {value ?? "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
