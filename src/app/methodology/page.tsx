import { Panel } from "@/components/layout/panel";
import Link from "next/link";

export const metadata = {
  title: "Evaluation Methodology — StackQuadrant",
  description: "How StackQuadrant evaluates AI developer tools: scoring rubrics, dimension weights, data sources, and benchmark methodology across 6 dimensions.",
  alternates: { canonical: "/methodology" },
};

const dimensions = [
  {
    name: "Code Generation",
    weight: "18.3%",
    rawWeight: 1.0,
    description: "Quality and accuracy of generated code, including correctness, completeness, and adherence to best practices.",
    rubric: [
      { range: "9.0–10.0", label: "Exceptional", meaning: "Generates production-ready code with minimal edits. Handles edge cases, follows project conventions, and produces idiomatic code across languages." },
      { range: "7.0–8.9", label: "Strong", meaning: "Generates correct code that usually compiles and runs. May need minor adjustments for edge cases or style consistency." },
      { range: "5.0–6.9", label: "Adequate", meaning: "Produces functional code with frequent minor issues — missing imports, incorrect types, or incomplete error handling." },
      { range: "3.0–4.9", label: "Below Average", meaning: "Code often requires significant corrections. Syntax errors, hallucinated APIs, or incorrect logic are common." },
      { range: "0.0–2.9", label: "Poor", meaning: "Generated code is rarely usable without major rewriting. Frequent factual errors about language features or APIs." },
    ],
  },
  {
    name: "Context Understanding",
    weight: "18.3%",
    rawWeight: 1.0,
    description: "Ability to comprehend project structure, dependencies, and codebase-wide context for accurate assistance.",
    rubric: [
      { range: "9.0–10.0", label: "Exceptional", meaning: "Understands full repository structure, cross-file dependencies, and architectural patterns. Suggestions are contextually aware of the entire project." },
      { range: "7.0–8.9", label: "Strong", meaning: "Good awareness of related files and imports. Occasionally misses project-specific conventions or distant dependencies." },
      { range: "5.0–6.9", label: "Adequate", meaning: "Works well within a single file. Limited cross-file awareness — may suggest imports that don't exist or miss relevant context." },
      { range: "3.0–4.9", label: "Below Average", meaning: "Struggles with multi-file context. Frequently generates code that conflicts with existing patterns or breaks dependencies." },
      { range: "0.0–2.9", label: "Poor", meaning: "Essentially context-blind. Suggestions ignore project structure and treat each file in isolation." },
    ],
  },
  {
    name: "Developer Experience",
    weight: "18.3%",
    rawWeight: 1.0,
    description: "Ease of use, IDE integration quality, onboarding speed, and workflow friction reduction.",
    rubric: [
      { range: "9.0–10.0", label: "Exceptional", meaning: "Seamless integration, intuitive UX, minimal configuration. Natural language instructions work reliably. Near-zero learning curve for basic tasks." },
      { range: "7.0–8.9", label: "Strong", meaning: "Good integration with minor friction points. Most features are discoverable. Setup takes under 10 minutes." },
      { range: "5.0–6.9", label: "Adequate", meaning: "Functional but requires learning. Some features are hidden or unintuitive. Configuration can be confusing." },
      { range: "3.0–4.9", label: "Below Average", meaning: "Significant friction in daily use. Frequent UI/UX issues, slow responses, or confusing interaction patterns." },
      { range: "0.0–2.9", label: "Poor", meaning: "Actively hinders workflow. Buggy interface, high latency, or complex setup with poor documentation." },
    ],
  },
  {
    name: "Multi-file Editing",
    weight: "16.5%",
    rawWeight: 0.9,
    description: "Capability to make coordinated changes across multiple files while maintaining consistency.",
    rubric: [
      { range: "9.0–10.0", label: "Exceptional", meaning: "Reliably edits 5+ files in a single operation. Maintains import consistency, updates tests, and propagates type changes across the codebase." },
      { range: "7.0–8.9", label: "Strong", meaning: "Handles 2–4 file edits well. Occasionally misses a related file that needs updating but core changes are correct." },
      { range: "5.0–6.9", label: "Adequate", meaning: "Can edit multiple files when explicitly instructed but doesn't proactively identify all files that need changes." },
      { range: "3.0–4.9", label: "Below Average", meaning: "Multi-file edits frequently break the build. Inconsistent handling of imports and cross-references." },
      { range: "0.0–2.9", label: "Poor", meaning: "Effectively single-file only. Multi-file requests produce broken or incomplete results." },
    ],
  },
  {
    name: "Debugging & Fixing",
    weight: "16.5%",
    rawWeight: 0.9,
    description: "Effectiveness at identifying bugs, suggesting fixes, and resolving errors in existing code.",
    rubric: [
      { range: "9.0–10.0", label: "Exceptional", meaning: "Accurately diagnoses root causes from error messages or stack traces. Fixes address the underlying issue, not just symptoms. Can debug complex async, race condition, and memory issues." },
      { range: "7.0–8.9", label: "Strong", meaning: "Good at common bug patterns. Identifies most issues from error output. May struggle with subtle or multi-layered bugs." },
      { range: "5.0–6.9", label: "Adequate", meaning: "Handles straightforward bugs (typos, missing imports, null checks) but struggles with logic errors or complex debugging scenarios." },
      { range: "3.0–4.9", label: "Below Average", meaning: "Often suggests superficial fixes that don't address root causes. May introduce new bugs while fixing existing ones." },
      { range: "0.0–2.9", label: "Poor", meaning: "Debugging suggestions are rarely helpful. Cannot parse error messages effectively or identify bug locations." },
    ],
  },
  {
    name: "Ecosystem Integration",
    weight: "14.7%",
    rawWeight: 0.8,
    description: "Support for various languages, frameworks, package managers, and development tools.",
    rubric: [
      { range: "9.0–10.0", label: "Exceptional", meaning: "Deep support for 10+ languages and their ecosystems. Understands framework-specific patterns (Next.js, Django, Rails, etc.), package managers, and build tools natively." },
      { range: "7.0–8.9", label: "Strong", meaning: "Good coverage of major languages and frameworks. May lack depth in niche ecosystems but handles mainstream stacks well." },
      { range: "5.0–6.9", label: "Adequate", meaning: "Supports popular languages well but has gaps in framework-specific knowledge or tooling integration." },
      { range: "3.0–4.9", label: "Below Average", meaning: "Limited language support. Frequently generates code that doesn't work with the specified framework version or toolchain." },
      { range: "0.0–2.9", label: "Poor", meaning: "Narrow language support with frequent ecosystem errors. Poor understanding of build systems and deployment tools." },
    ],
  },
];

function ScoreColor({ range }: { range: string }) {
  const start = parseFloat(range);
  const color = start >= 9 ? "var(--score-high)" : start >= 7 ? "#22c55e" : start >= 5 ? "var(--score-mid)" : start >= 3 ? "#f97316" : "var(--score-low)";
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color, minWidth: "70px", display: "inline-block" }}>
      {range}
    </span>
  );
}

export default function MethodologyPage() {
  return (
    <div style={{ padding: "var(--grid-gap)", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div
        className="px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
          Evaluation Methodology
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-2)", lineHeight: "1.6" }}>
          StackQuadrant evaluates AI developer tools through structured, reproducible benchmarks and expert assessment across six core dimensions. Our goal is to provide developers with data-driven insights, not marketing-driven rankings.
        </p>
      </div>

      {/* Scoring Process */}
      <Panel title="How We Score">
        <div className="methodology-process-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-3)" }}>
          {[
            { step: "01", title: "Benchmark Tasks", desc: "Each tool is tested against standardized real-world tasks: multi-file refactoring, bug detection, greenfield scaffolding, context window stress tests, and test generation. Tasks are run 3 times per tool; best result is used." },
            { step: "02", title: "Expert Evaluation", desc: "Experienced developers rate each tool across six dimensions on a 0–10 scale, providing evidence for each score. Evaluations are cross-reviewed by a second evaluator for consistency." },
            { step: "03", title: "Weighted Aggregation", desc: "Overall scores are computed as weighted averages of dimension scores. Weights reflect the relative importance of each dimension for professional development workflows." },
            { step: "04", title: "Quadrant Positioning", desc: "Tools are positioned on quadrant charts based on two orthogonal axes (e.g., 'Ability to Execute' vs. 'Completeness of Vision'). Positions are determined by composite scores along each axis." },
          ].map((s) => (
            <div key={s.step} style={{ padding: "var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "var(--space-1)" }}>{s.step}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>{s.title}</div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Dimension Weights Overview */}
      <div style={{ marginTop: "var(--grid-gap)" }}>
        <Panel title="Dimension Weights">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "var(--space-3)" }}>
            The overall score is a weighted average of all six dimension scores. Weights reflect the importance of each capability for professional AI-assisted development. Core capabilities (code generation, context understanding, developer experience) carry equal and highest weight.
          </p>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {dimensions.map((d) => (
              <div
                key={d.name}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-elevated)",
                  flex: "1 1 160px",
                }}
              >
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{d.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "var(--accent-primary)", marginTop: "2px" }}>{d.weight}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Scoring Rubrics per Dimension */}
      <div style={{ marginTop: "var(--grid-gap)" }}>
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
          Scoring Rubrics by Dimension
        </h2>
        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          {dimensions.map((dim) => (
            <Panel key={dim.name} title={`${dim.name} (${dim.weight})`}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "var(--space-3)" }}>
                {dim.description}
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                    <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Score Range</th>
                    <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Level</th>
                    <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>What This Means</th>
                  </tr>
                </thead>
                <tbody>
                  {dim.rubric.map((r) => (
                    <tr key={r.range} style={{ borderBottom: "1px solid var(--border-default)" }}>
                      <td style={{ padding: "8px", verticalAlign: "top" }}>
                        <ScoreColor range={r.range} />
                      </td>
                      <td style={{ padding: "8px", verticalAlign: "top", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                        {r.label}
                      </td>
                      <td style={{ padding: "8px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        {r.meaning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div style={{ marginTop: "var(--grid-gap)" }}>
        <Panel title="Data Sources & Transparency">
          <div className="flex flex-col gap-[var(--space-3)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            <div style={{ padding: "var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Hands-on Testing</div>
              <p style={{ fontSize: "11px" }}>
                Every tool is tested directly by our evaluation team on real development tasks. We use consistent test environments (macOS/Linux, VS Code or native CLI, Node.js and Python projects) to ensure comparable results. Each benchmark task is documented and reproducible.
              </p>
            </div>
            <div style={{ padding: "var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Community Benchmarks</div>
              <p style={{ fontSize: "11px" }}>
                We incorporate results from established community benchmarks including SWE-bench, HumanEval, and Aider&apos;s polyglot benchmark where tools participate. Community benchmark scores are weighted alongside our hands-on testing, not used as sole evidence.
              </p>
            </div>
            <div style={{ padding: "var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Public Documentation & Changelogs</div>
              <p style={{ fontSize: "11px" }}>
                Tool capabilities are verified against official documentation and release notes. We track version changes and feature additions to ensure scores reflect the current state of each tool, not historical versions.
              </p>
            </div>
            <div style={{ padding: "var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Limitations & Honest Disclosure</div>
              <p style={{ fontSize: "11px" }}>
                Our evaluations are expert-informed assessments, not automated measurements. Scores reflect a composite of quantitative benchmarks and qualitative expert judgment. We acknowledge that tool performance varies by use case, language, and project complexity. Where evidence is limited, we note it in the score evidence field on each tool page.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Update Cadence */}
      <div style={{ marginTop: "var(--grid-gap)" }}>
        <Panel title="Update Cadence">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            <p>
              Evaluations are updated <strong style={{ color: "var(--text-primary)" }}>quarterly</strong> to reflect product changes, new releases, and evolving capabilities. Major tool launches or significant updates may trigger out-of-cycle re-evaluations. All historical scores are preserved for trend analysis.
            </p>
            <p style={{ marginTop: "var(--space-2)" }}>
              When a tool is re-evaluated without score changes, we mark it as &quot;Confirmed current&quot; with the revalidation date.
            </p>
          </div>
        </Panel>
      </div>

      {/* CTA */}
      <div
        style={{
          marginTop: "var(--grid-gap)",
          padding: "var(--space-4)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          textAlign: "center",
        }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>
          Disagree with a score? Have evidence we should consider?
        </p>
        <Link
          href="/help"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 600,
            padding: "8px 20px",
            background: "var(--accent-primary)",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Submit Feedback
        </Link>
      </div>
    </div>
  );
}
