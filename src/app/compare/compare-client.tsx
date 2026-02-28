"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { ScoreBar } from "@/components/visualizations/score-bar";
import { CompareRadarChart } from "@/components/visualizations/compare-radar-chart";

type ToolScore = { dimension: string; dimensionSlug: string; score: number | null };
type CompareTool = {
  id: string;
  name: string;
  slug: string;
  category: string;
  vendor: string | null;
  overallScore: number | null;
  pricingModel: string | null;
  pricingTier: string | null;
  license: string | null;
  githubUrl: string | null;
  documentationUrl: string | null;
  githubStars: number | null;
  communitySize: string | null;
  websiteUrl: string | null;
  tags: string[];
  scores: ToolScore[];
};

export function CompareClient({
  tools,
  allTools,
  initialSlugs,
}: {
  tools: CompareTool[];
  allTools: { name: string; slug: string }[];
  initialSlugs: string[];
}) {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);

  function updateComparison(slugs: string[]) {
    setSelectedSlugs(slugs);
    if (slugs.length >= 2) {
      router.push(`/compare?tools=${slugs.join(",")}`);
    }
  }

  function addTool(slug: string) {
    if (selectedSlugs.length < 4 && !selectedSlugs.includes(slug)) {
      updateComparison([...selectedSlugs, slug]);
    }
  }

  function removeTool(slug: string) {
    updateComparison(selectedSlugs.filter((s) => s !== slug));
  }

  const dimensions = tools.length > 0 ? tools[0].scores.map((s) => s.dimension) : [];
  const availableTools = allTools.filter((t) => !selectedSlugs.includes(t.slug));

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--space-5) var(--space-4)" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>
          Compare Tools
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
          Side-by-side comparison across dimensions, pricing, and community
        </p>
      </div>

      {/* Tool Selector */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "var(--space-2)",
        marginBottom: "var(--space-5)", padding: "var(--space-3)",
        background: "var(--bg-surface)", border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
      }}>
        {selectedSlugs.map((slug) => {
          const tool = allTools.find((t) => t.slug === slug);
          return (
            <button
              key={slug}
              onClick={() => removeTool(slug)}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                padding: "4px 10px", background: "var(--accent-primary)",
                color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {tool?.name || slug} <span style={{ opacity: 0.7 }}>x</span>
            </button>
          );
        })}
        {selectedSlugs.length < 4 && (
          <>
          <label htmlFor="compare-add-tool" className="sr-only">Add tool to comparison</label>
          <select
            id="compare-add-tool"
            onChange={(e) => { if (e.target.value) { addTool(e.target.value); e.target.value = ""; } }}
            style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              padding: "4px 8px", background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)", cursor: "pointer",
            }}
            defaultValue=""
          >
            <option value="" disabled>+ Add tool ({4 - selectedSlugs.length} remaining)</option>
            {availableTools.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
          </>
        )}
      </div>

      {tools.length < 2 ? (
        <div style={{
          textAlign: "center", padding: "var(--space-8)",
          fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)",
        }}>
          Select at least 2 tools above to compare them side-by-side.
          <div style={{ marginTop: "var(--space-3)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)", justifyContent: "center" }}>
            {[
              { label: "Claude Code vs Cursor", slugs: "claude-code,cursor" },
              { label: "Aider vs Cline vs Continue", slugs: "aider,cline,continue-dev" },
              { label: "Copilot vs Cursor vs Windsurf", slugs: "github-copilot,cursor,windsurf" },
            ].map((preset) => (
              <Link
                key={preset.slugs}
                href={`/compare?tools=${preset.slugs}`}
                style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  padding: "6px 12px", border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)", color: "var(--text-secondary)",
                  textDecoration: "none",
                }}
              >
                {preset.label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Overall Scores */}
          <Section title="OVERALL SCORE">
            <div className="compare-grid-dynamic" style={{ display: "grid", gridTemplateColumns: `repeat(${tools.length}, 1fr)`, minWidth: 0, gap: "var(--space-4)" }}>
              {tools.map((tool) => (
                <div key={tool.id} style={{ textAlign: "center" }}>
                  <Link href={`/tools/${tool.slug}`} style={{ textDecoration: "none", color: "var(--text-primary)" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, marginBottom: "var(--space-2)" }}>
                      {tool.name}
                    </div>
                  </Link>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-2)" }}>
                    <ScoreRing score={tool.overallScore || 0} size={80} />
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                    {tool.category}
                  </div>
                  {tool.vendor && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      by {tool.vendor}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Radar Chart Overlay */}
          <Section title="CAPABILITY OVERLAY">
            <CompareRadarChart
              tools={tools.map((tool) => ({
                name: tool.name,
                scores: tool.scores
                  .filter((s) => s.score !== null)
                  .map((s) => ({ dimension: s.dimension, score: s.score! })),
              }))}
              size={360}
            />
          </Section>

          {/* Dimension Scores */}
          <Section title="DIMENSION SCORES">
            {dimensions.map((dim) => (
              <div key={dim} style={{ marginBottom: "var(--space-3)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>
                  {dim}
                </div>
                <div className="compare-grid-dynamic" style={{ display: "grid", gridTemplateColumns: `repeat(${tools.length}, 1fr)`, minWidth: 0, gap: "var(--space-3)" }}>
                  {tools.map((tool) => {
                    const s = tool.scores.find((sc) => sc.dimension === dim);
                    const scores = tools.map((t) => t.scores.find((sc) => sc.dimension === dim)?.score || 0);
                    const best = Math.max(...scores);
                    const isBest = s?.score === best && tools.length > 1;
                    return (
                      <div key={tool.id}>
                        <ScoreBar label={tool.name} score={s?.score || 0} maxScore={10} />
                        {isBest && (
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent-primary)", marginTop: "2px" }}>
                            BEST
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Section>

          {/* Pricing */}
          <Section title="PRICING">
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${tools.length}, 1fr)`, minWidth: 0, gap: "var(--space-4)" }}>
              {tools.map((tool) => (
                <div key={tool.id}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>
                    {tool.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "var(--space-1)" }}>
                    <span style={{
                      display: "inline-block", padding: "2px 6px",
                      background: tool.pricingModel === "free" ? "rgba(22,163,74,0.15)" : tool.pricingModel === "freemium" ? "rgba(59,130,246,0.15)" : "rgba(234,179,8,0.15)",
                      color: tool.pricingModel === "free" ? "var(--score-high)" : tool.pricingModel === "freemium" ? "#3b82f6" : "var(--score-mid)",
                      borderRadius: "var(--radius-sm)", fontSize: "10px", textTransform: "uppercase",
                    }}>
                      {tool.pricingModel || "N/A"}
                    </span>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {tool.pricingTier || "Pricing not available"}
                  </div>
                  {tool.license && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
                      License: {tool.license}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Community & Links */}
          <Section title="COMMUNITY & LINKS">
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${tools.length}, 1fr)`, minWidth: 0, gap: "var(--space-4)" }}>
              {tools.map((tool) => (
                <div key={tool.id} style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
                    {tool.name}
                  </div>
                  {tool.communitySize && (
                    <InfoRow label="Community" value={tool.communitySize} />
                  )}
                  {tool.githubStars && (
                    <InfoRow label="GitHub Stars" value={`${(tool.githubStars / 1000).toFixed(1)}K`} />
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "var(--space-2)" }}>
                    {tool.websiteUrl && <SmallLink href={tool.websiteUrl} label="Website" />}
                    {tool.documentationUrl && <SmallLink href={tool.documentationUrl} label="Docs" />}
                    {tool.githubUrl && <SmallLink href={tool.githubUrl} label="GitHub" />}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Tags */}
          <Section title="FEATURES & TAGS">
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${tools.length}, 1fr)`, minWidth: 0, gap: "var(--space-4)" }}>
              {tools.map((tool) => (
                <div key={tool.id}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
                    {tool.name}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {tool.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontFamily: "var(--font-mono)", fontSize: "10px",
                          padding: "2px 6px", background: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                          borderRadius: "var(--radius-sm)", color: "var(--text-secondary)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Share link */}
          <div style={{
            marginTop: "var(--space-4)", padding: "var(--space-3)",
            background: "var(--bg-surface)", border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)", textAlign: "center",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "var(--space-1)" }}>
              SHARE THIS COMPARISON
            </div>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
              {typeof window !== "undefined" ? window.location.href : `/compare?tools=${tools.map((t) => t.slug).join(",")}`}
            </code>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: "var(--space-5)", padding: "var(--space-4)",
      background: "var(--bg-surface)", border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-sm)",
    }}>
      <h2 style={{
        fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600,
        color: "var(--text-muted)", textTransform: "uppercase",
        letterSpacing: "0.08em", marginBottom: "var(--space-3)",
        paddingBottom: "var(--space-2)", borderBottom: "1px solid var(--border-default)",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
      <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>{label}</span>
      <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{value}</span>
    </div>
  );
}

function SmallLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontFamily: "var(--font-mono)", fontSize: "10px",
        padding: "2px 6px", border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)", color: "var(--accent-primary)",
        textDecoration: "none",
      }}
    >
      {label}
    </a>
  );
}
