"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Panel } from "@/components/layout/panel";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { RadarChart } from "@/components/visualizations/radar-chart";

interface StackTool {
  id: string;
  name: string;
  slug: string;
  category: string;
  vendor: string | null;
  overallScore: number | null;
  bestFor: string[] | null;
  scores: Array<{ dimension: string; dimensionSlug: string; score: number }>;
}

const ROLE_OPTIONS = [
  "Primary IDE Assistant",
  "Code Review",
  "Testing & QA",
  "Documentation",
  "DevOps & CI/CD",
  "Security Scanner",
  "Data Analysis",
  "Other",
] as const;

export function StackBuilderClient({ availableTools }: { availableTools: StackTool[] }) {
  const [selectedTools, setSelectedTools] = useState<Array<{ toolId: string; role: string }>>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedToolIds = new Set(selectedTools.map((s) => s.toolId));

  const filteredAvailable = useMemo(() => {
    return availableTools.filter((t) => {
      if (selectedToolIds.has(t.id)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.vendor || "").toLowerCase().includes(q);
    });
  }, [availableTools, selectedToolIds, searchQuery]);

  const stackTools = selectedTools.map((st) => ({
    ...st,
    tool: availableTools.find((t) => t.id === st.toolId)!,
  })).filter((st) => st.tool);

  // Calculate stack analysis
  const stackAnalysis = useMemo(() => {
    if (stackTools.length === 0) return null;

    // Average overall score
    const scores = stackTools.map((st) => st.tool.overallScore || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Dimension averages across all tools
    const dimensionMap = new Map<string, { total: number; count: number; slug: string }>();
    for (const st of stackTools) {
      for (const s of st.tool.scores) {
        const existing = dimensionMap.get(s.dimension) || { total: 0, count: 0, slug: s.dimensionSlug };
        existing.total += s.score;
        existing.count += 1;
        dimensionMap.set(s.dimension, existing);
      }
    }

    const dimensionAverages = Array.from(dimensionMap.entries()).map(([name, data]) => ({
      dimension: name,
      dimensionSlug: data.slug,
      score: data.total / data.count,
    }));

    // Strengths (>= 8) and gaps (< 6)
    const strengths = dimensionAverages.filter((d) => d.score >= 8);
    const gaps = dimensionAverages.filter((d) => d.score < 6);

    // Category diversity
    const categories = new Set(stackTools.map((st) => st.tool.category));

    return { avgScore, dimensionAverages, strengths, gaps, categoryCount: categories.size };
  }, [stackTools]);

  const addTool = (toolId: string) => {
    if (selectedTools.length >= 8) return;
    setSelectedTools([...selectedTools, { toolId, role: ROLE_OPTIONS[0] }]);
  };

  const removeTool = (toolId: string) => {
    setSelectedTools(selectedTools.filter((s) => s.toolId !== toolId));
  };

  const updateRole = (toolId: string, role: string) => {
    setSelectedTools(selectedTools.map((s) => s.toolId === toolId ? { ...s, role } : s));
  };

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      <div style={{ marginBottom: "var(--grid-gap)" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Stack Builder
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>
          Select up to 8 tools to build your AI development stack. See how they complement each other.
        </p>
      </div>

      <div className="stack-builder-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--grid-gap)" }}>
        {/* Left: Tool selector */}
        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          <Panel title={`Available Tools (${filteredAvailable.length})`}>
            <div style={{ marginBottom: "var(--space-2)" }}>
              <label htmlFor="stack-search" className="sr-only">Search tools</label>
              <input
                id="stack-search"
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "6px 10px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>
            <div className="flex flex-col gap-[var(--space-1)]" style={{ maxHeight: "500px", overflowY: "auto" }}>
              {filteredAvailable.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => addTool(tool.id)}
                  disabled={selectedTools.length >= 8}
                  className="flex items-center gap-[var(--space-2)]"
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    background: "transparent",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    cursor: selectedTools.length >= 8 ? "not-allowed" : "pointer",
                    opacity: selectedTools.length >= 8 ? 0.5 : 1,
                    textAlign: "left",
                    transition: "border-color 150ms",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-[var(--space-1)]">
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {tool.name}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", padding: "1px 4px", background: "var(--bg-elevated)", borderRadius: "2px" }}>
                        {tool.category}
                      </span>
                    </div>
                    {tool.vendor && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>{tool.vendor}</span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700,
                    color: (tool.overallScore || 0) >= 8 ? "var(--score-high)" : (tool.overallScore || 0) >= 5 ? "var(--score-mid)" : "var(--score-low)",
                  }}>
                    {tool.overallScore?.toFixed(1) || "—"}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-primary)" }}>+ Add</span>
                </button>
              ))}
              {filteredAvailable.length === 0 && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "var(--space-3)" }}>
                  {searchQuery ? "No matching tools found" : "All tools have been added"}
                </p>
              )}
            </div>
          </Panel>
        </div>

        {/* Right: Stack composition + analysis */}
        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          <Panel title={`Your Stack (${stackTools.length}/8)`}>
            {stackTools.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-4)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
                  Add tools from the left panel to start building your stack.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[var(--space-2)]">
                {stackTools.map((st) => (
                  <div
                    key={st.toolId}
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <Link href={`/tools/${st.tool.slug}`} style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {st.tool.name}
                      </Link>
                      <div className="flex items-center gap-[var(--space-2)]">
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700,
                          color: (st.tool.overallScore || 0) >= 8 ? "var(--score-high)" : "var(--score-mid)",
                        }}>
                          {st.tool.overallScore?.toFixed(1)}
                        </span>
                        <button
                          onClick={() => removeTool(st.toolId)}
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--score-low)",
                            background: "transparent", border: "none", cursor: "pointer",
                            padding: "2px 6px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-[var(--space-2)] mt-1">
                      <label htmlFor={`role-${st.toolId}`} className="sr-only">Role for {st.tool.name}</label>
                      <select
                        id={`role-${st.toolId}`}
                        value={st.role}
                        onChange={(e) => updateRole(st.toolId, e.target.value)}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-default)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                        {st.tool.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Stack Analysis */}
          {stackAnalysis && (
            <>
              <Panel title="Stack Analysis">
                <div className="flex items-center gap-[var(--space-4)]" style={{ marginBottom: "var(--space-3)" }}>
                  <div className="flex items-center gap-[var(--space-2)]">
                    <ScoreRing score={stackAnalysis.avgScore} size={56} strokeWidth={4} label="avg" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Stack Score
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {stackAnalysis.avgScore.toFixed(1)}/10
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      {stackTools.length} tools · {stackAnalysis.categoryCount} {stackAnalysis.categoryCount === 1 ? "category" : "categories"}
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                {stackAnalysis.strengths.length > 0 && (
                  <div style={{ marginBottom: "var(--space-2)" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--score-high)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      Strengths
                    </div>
                    <div className="flex flex-wrap gap-[var(--space-1)]">
                      {stackAnalysis.strengths.map((s) => (
                        <span
                          key={s.dimensionSlug}
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: "10px",
                            padding: "2px 8px", borderRadius: "var(--radius-sm)",
                            background: "rgba(22,163,74,0.1)", color: "var(--score-high)",
                          }}
                        >
                          {s.dimension} ({s.score.toFixed(1)})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps */}
                {stackAnalysis.gaps.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--score-low)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      Gaps
                    </div>
                    <div className="flex flex-wrap gap-[var(--space-1)]">
                      {stackAnalysis.gaps.map((g) => (
                        <span
                          key={g.dimensionSlug}
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: "10px",
                            padding: "2px 8px", borderRadius: "var(--radius-sm)",
                            background: "rgba(239,68,68,0.1)", color: "var(--score-low)",
                          }}
                        >
                          {g.dimension} ({g.score.toFixed(1)})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>

              {/* Radar overlay */}
              {stackAnalysis.dimensionAverages.length >= 3 && (
                <Panel title="Capability Profile">
                  <div className="flex justify-center">
                    <RadarChart
                      scores={stackAnalysis.dimensionAverages.map((d) => ({
                        dimension: d.dimension,
                        score: d.score,
                      }))}
                      size={240}
                    />
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textAlign: "center", marginTop: "var(--space-1)" }}>
                    Averaged across {stackTools.length} tools
                  </p>
                </Panel>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
