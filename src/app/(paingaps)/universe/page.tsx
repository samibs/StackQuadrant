"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface PainPointResult {
  id: string;
  title: string;
  summary: string;
  severityScore: number;
  frequencyScore: number;
  marketSizeScore: number;
  competitionScore: number;
  wtpScore: number;
  trendDirection: string;
  sourceCount: number;
  competitorNames: string[] | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UniversePage() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [results, setResults] = useState<PainPointResult[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [minSeverity, setMinSeverity] = useState(0);
  const [trendDirection, setTrendDirection] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [page, setPage] = useState(1);

  const doSearch = useCallback(async (p: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (minSeverity > 0) params.set("minSeverity", String(minSeverity));
      if (trendDirection) params.set("trendDirection", trendDirection);
      if (sourceType) params.set("sourceType", sourceType);
      params.set("page", String(p));

      const res = await authFetch(`/api/v1/universe/search?${params.toString()}`);
      if (res.status === 429) {
        setIsPro(false);
        return;
      }
      const data = await res.json();
      setResults(data.data?.results || []);
      setPagination(data.data?.pagination || null);
      setPage(p);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [keyword, minSeverity, trendDirection, sourceType, authFetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
  }, [user, authLoading, router]);

  const trendIcon = (dir: string) => dir === "growing" ? "↑" : dir === "declining" ? "↓" : "→";
  const trendColor = (dir: string) => dir === "growing" ? "#ef4444" : dir === "declining" ? "#10b981" : "#6b7280";

  if (!isPro) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: 16 }}>Opportunity Universe</h1>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24 }}>
          <p style={{ fontSize: "14px", marginBottom: 16 }}>The Opportunity Universe requires a Pro plan ($79/mo).</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: 16 }}>
            Search historical pain points across all public scans. Filter by keyword, source, severity, trend, and date range.
          </p>
          <Link href="/pricing" style={{
            display: "inline-block", padding: "8px 16px", background: "var(--accent)", color: "white",
            borderRadius: 4, textDecoration: "none", fontSize: "12px", fontWeight: 600,
          }}>Upgrade to Pro</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/scans" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Scans</Link>
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginTop: 4 }}>Opportunity Universe</h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Search historical pain points across all completed scans</p>
      </div>

      {/* Search Bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch(1)}
          placeholder="Search pain points..." style={{
            fontFamily: "var(--font-mono)", fontSize: "12px", padding: "8px 12px", flex: 1, minWidth: 200,
            background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit",
          }} />
        <button onClick={() => doSearch(1)} style={{
          padding: "8px 16px", background: "var(--accent)", color: "white",
          border: "none", borderRadius: 4, fontSize: "12px", fontWeight: 600, cursor: "pointer",
        }}>Search</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 2 }}>MIN SEVERITY</label>
          <input type="number" value={minSeverity} onChange={(e) => setMinSeverity(parseInt(e.target.value) || 0)}
            min={0} max={100} style={{
              fontFamily: "var(--font-mono)", fontSize: "11px", padding: "4px 8px", width: 70,
              background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit",
            }} />
        </div>
        <div>
          <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 2 }}>TREND</label>
          <select value={trendDirection} onChange={(e) => setTrendDirection(e.target.value)} style={{
            fontFamily: "var(--font-mono)", fontSize: "11px", padding: "4px 8px",
            background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit",
          }}>
            <option value="">All</option>
            <option value="growing">Growing</option>
            <option value="stable">Stable</option>
            <option value="declining">Declining</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 2 }}>SOURCE</label>
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} style={{
            fontFamily: "var(--font-mono)", fontSize: "11px", padding: "4px 8px",
            background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit",
          }}>
            <option value="">All Sources</option>
            <option value="reddit">Reddit</option>
            <option value="twitter">Twitter/X</option>
            <option value="google-autocomplete">Google</option>
            <option value="review-site">Reviews</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Searching...</div>
      ) : results.length === 0 && pagination ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)" }}>
          No pain points found matching your criteria.
        </div>
      ) : results.length > 0 ? (
        <>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 12 }}>
            Showing {results.length} of {pagination?.total || 0} results
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((pp) => (
              <div key={pp.id} style={{
                background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: 3,
                    background: pp.severityScore > 70 ? "#ef4444" : pp.severityScore > 40 ? "#f59e0b" : "#10b981",
                    color: "white",
                  }}>{pp.severityScore}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>{pp.title}</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: trendColor(pp.trendDirection) }}>
                    {trendIcon(pp.trendDirection)} {pp.trendDirection}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: 6 }}>
                  {pp.summary.slice(0, 200)}{pp.summary.length > 200 ? "..." : ""}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: "10px", color: "var(--text-muted)", flexWrap: "wrap" }}>
                  <span>Market: {pp.marketSizeScore}</span>
                  <span>Competition: {pp.competitionScore}</span>
                  <span>WTP: {pp.wtpScore}</span>
                  <span>Sources: {pp.sourceCount}</span>
                  <span>{new Date(pp.createdAt).toLocaleDateString()}</span>
                  {pp.competitorNames && pp.competitorNames.length > 0 && (
                    <span style={{ color: "#f59e0b" }}>Gaps: {pp.competitorNames.join(", ")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
              <button onClick={() => doSearch(page - 1)} disabled={page <= 1} style={{
                padding: "6px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)",
                borderRadius: 4, fontSize: "11px", cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.5 : 1, color: "inherit",
              }}>← Prev</button>
              <span style={{ fontSize: "11px", padding: "6px 12px", color: "var(--text-muted)" }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button onClick={() => doSearch(page + 1)} disabled={page >= pagination.totalPages} style={{
                padding: "6px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)",
                borderRadius: 4, fontSize: "11px", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer",
                opacity: page >= pagination.totalPages ? 0.5 : 1, color: "inherit",
              }}>Next →</button>
            </div>
          )}
        </>
      ) : (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)" }}>
          Enter a search term and click Search to explore historical pain points.
        </div>
      )}
    </div>
  );
}
