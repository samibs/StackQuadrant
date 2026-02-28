import { Panel } from "@/components/layout/panel";

export const metadata = {
  title: "Evaluation Methodology",
  description: "How StackQuadrant evaluates AI developer tools: benchmark tasks, expert evaluation, weighted scoring across 6 dimensions, and quadrant positioning methodology.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  const dimensions = [
    { name: "Code Generation", description: "Quality and accuracy of generated code, including correctness, completeness, and adherence to best practices." },
    { name: "Context Understanding", description: "Ability to comprehend project structure, dependencies, and codebase-wide context for accurate assistance." },
    { name: "Developer Experience", description: "Ease of use, IDE integration quality, onboarding speed, and workflow friction reduction." },
    { name: "Multi-file Editing", description: "Capability to make coordinated changes across multiple files while maintaining consistency." },
    { name: "Debugging & Fixing", description: "Effectiveness at identifying bugs, suggesting fixes, and resolving errors in existing code." },
    { name: "Ecosystem Integration", description: "Support for various languages, frameworks, package managers, and development tools." },
  ];

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      <div
        className="px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
          Evaluation Methodology
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-2)", lineHeight: "1.6" }}>
          StackQuadrant evaluates AI developer tools through structured, reproducible benchmarks and expert assessment across six core dimensions. Our goal is to provide developers with data-driven insights, not marketing-driven rankings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--grid-gap)" }}>
        <Panel title="Evaluation Dimensions">
          <div className="flex flex-col gap-[var(--space-3)]">
            {dimensions.map((d, i) => (
              <div key={d.name} style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div className="flex items-center gap-[var(--space-2)]">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", width: "18px" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {d.name}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "var(--space-1)", marginLeft: "26px", lineHeight: "1.5" }}>
                  {d.description}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          <Panel title="Scoring Process">
            <div className="flex flex-col gap-[var(--space-3)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.6" }}>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>1. Benchmark Tasks</div>
                <p style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                  Each tool is tested against a standardized set of real-world development tasks: multi-file refactoring, bug detection, greenfield scaffolding, context window stress tests, and test generation. Tasks are run 3 times per tool; best result is used.
                </p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>2. Expert Evaluation</div>
                <p style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                  Experienced developers rate each tool across six dimensions on a 0-10 scale, providing evidence for each score. Evaluations are cross-reviewed for consistency.
                </p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>3. Weighted Aggregation</div>
                <p style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                  Overall scores are computed as weighted averages of dimension scores. Weights reflect the relative importance of each dimension for professional development workflows.
                </p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>4. Quadrant Positioning</div>
                <p style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                  Tools are positioned on quadrant charts based on two orthogonal axes (e.g., &quot;Ability to Execute&quot; vs. &quot;Completeness of Vision&quot;). Positions are determined by composite scores along each axis.
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Update Cadence">
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Evaluations are updated quarterly to reflect product changes, new releases, and evolving capabilities. Major tool launches or significant updates may trigger out-of-cycle re-evaluations. All historical data is preserved for trend analysis.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
