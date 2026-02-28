"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ScoreBar } from "@/components/visualizations/score-bar";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { InfoIcon } from "@/components/ui/tooltip";

interface ToolData {
  id: string;
  name: string;
  slug: string;
  category: string;
  vendor: string | null;
  overallScore: number | null;
  tags: string[] | null;
  pricingModel: string | null;
  updatedAt: string | Date | null;
  scores: Array<{ dimension: string; dimensionSlug: string; dimensionDescription: string | null; dimensionWeight: number | null; score: number | null }>;
}

export function MatrixClient({ tools }: { tools: ToolData[] }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState("overallScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [search, setSearch] = useState("");
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const toggleCompare = (slug: string) => {
    setCompareSelection((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length < 4 ? [...prev, slug] : prev
    );
  };

  const categories = useMemo(() => [...new Set(tools.map((t) => t.category))], [tools]);
  const allTags = useMemo(() => [...new Set(tools.flatMap((t) => (t.tags || []) as string[]))].sort(), [tools]);

  const dimensions = useMemo(() => {
    if (tools.length === 0) return [];
    return tools[0].scores.map((s) => ({ name: s.dimension, slug: s.dimensionSlug, description: s.dimensionDescription, weight: s.dimensionWeight }));
  }, [tools]);

  const sorted = useMemo(() => {
    let filtered = tools;
    if (categoryFilter) {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }
    if (search) {
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (tagFilter) {
      filtered = filtered.filter((t) => ((t.tags || []) as string[]).includes(tagFilter));
    }
    return [...filtered].sort((a, b) => {
      let aVal: number | null = null;
      let bVal: number | null = null;

      if (sortBy === "overallScore") {
        aVal = a.overallScore;
        bVal = b.overallScore;
      } else if (sortBy === "name") {
        return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else {
        aVal = a.scores.find((s) => s.dimensionSlug === sortBy)?.score ?? null;
        bVal = b.scores.find((s) => s.dimensionSlug === sortBy)?.score ?? null;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [tools, sortBy, sortDir, categoryFilter, tagFilter, search]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return <span style={{ marginLeft: "4px", fontSize: "10px" }}>{sortDir === "desc" ? "\u25BC" : "\u25B2"}</span>;
  };

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      {/* Controls bar */}
      <div
        className="matrix-controls flex items-center gap-[var(--space-2)] mb-[var(--grid-gap)] flex-wrap"
        style={{
          padding: "var(--space-2) var(--space-3)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            padding: "4px 12px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            outline: "none",
            width: "200px",
          }}
        />
        <div className="flex items-center gap-[var(--space-1)]">
          <button
            onClick={() => setCategoryFilter("")}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              background: !categoryFilter ? "var(--bg-elevated)" : "transparent",
              border: !categoryFilter ? "1px solid var(--border-strong)" : "1px solid transparent",
              color: !categoryFilter ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            ALL
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                background: categoryFilter === cat ? "var(--bg-elevated)" : "transparent",
                border: categoryFilter === cat ? "1px solid var(--border-strong)" : "1px solid transparent",
                color: categoryFilter === cat ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            padding: "4px 8px", background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)",
            color: tagFilter ? "var(--text-primary)" : "var(--text-muted)", cursor: "pointer",
          }}
        >
          <option value="">All features</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        {compareSelection.length >= 2 && (
          <button
            onClick={() => router.push(`/compare?tools=${compareSelection.join(",")}`)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 12px",
              background: "var(--accent-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            Compare {compareSelection.length} tools &rarr;
          </button>
        )}
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
          {sorted.length} tools
        </span>
      </div>

      {/* Matrix table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          overflow: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th style={{ padding: "10px 8px", width: "32px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                  {compareSelection.length > 0 ? compareSelection.length : ""}
                </span>
              </th>
              <th
                className="cursor-pointer select-none"
                onClick={() => handleSort("name")}
                style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}
              >
                Tool <SortIndicator field="name" />
              </th>
              <th
                className="cursor-pointer select-none"
                onClick={() => handleSort("overallScore")}
                style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}
              >
                <span className="inline-flex items-center gap-1">
                  Overall <SortIndicator field="overallScore" />
                  <InfoIcon tip="Weighted average of all dimension scores. Higher is better (0-10 scale)." />
                </span>
              </th>
              {dimensions.map((dim) => (
                <th
                  key={dim.slug}
                  className="cursor-pointer select-none"
                  onClick={() => handleSort(dim.slug)}
                  style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", minWidth: "140px" }}
                >
                  <span className="inline-flex items-center gap-1">
                    {dim.name} <SortIndicator field={dim.slug} />
                    {dim.description && (
                      <InfoIcon tip={
                        <span>
                          {dim.description}
                          {dim.weight && <span style={{ display: "block", marginTop: 4, color: "var(--text-muted)" }}>Weight: {(dim.weight * 100).toFixed(0)}%</span>}
                        </span>
                      } />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((tool, i) => (
              <motion.tr
                key={tool.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                style={{ borderBottom: "1px solid var(--border-default)" }}
                className="transition-colors duration-100"
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "8px", width: "32px" }}>
                  <input
                    type="checkbox"
                    checked={compareSelection.includes(tool.slug)}
                    onChange={() => toggleCompare(tool.slug)}
                    disabled={!compareSelection.includes(tool.slug) && compareSelection.length >= 4}
                    style={{ cursor: "pointer", accentColor: "var(--accent-primary)" }}
                    aria-label={`Select ${tool.name} for comparison`}
                  />
                </td>
                <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                  <Link href={`/tools/${tool.slug}`} className="no-underline">
                    <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--text-primary)" }}>{tool.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginLeft: "8px" }}>{tool.category}</span>
                    {tool.updatedAt && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", marginLeft: "8px" }}>
                        {new Date(tool.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </Link>
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  <div className="flex justify-center">
                    <div className="relative" style={{ width: "40px", height: "40px" }}>
                      <ScoreRing score={tool.overallScore || 0} size={40} strokeWidth={3} />
                    </div>
                  </div>
                </td>
                {tool.scores.map((s) => (
                  <td key={s.dimensionSlug} style={{ padding: "8px 12px" }}>
                    {s.score !== null ? <ScoreBar score={s.score} /> : <span style={{ color: "var(--text-muted)" }}>-</span>}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
