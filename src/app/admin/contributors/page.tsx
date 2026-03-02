"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useState, useEffect, useCallback } from "react";

interface Contributor {
  emailHash: string;
  emailPreview: string | null;
  totalSubmissions: number;
  approvedCount: number;
  rejectedCount: number;
  reputationScore: number;
  firstSubmission: string | null;
  lastSubmission: string | null;
  autoApproveEligible: boolean;
}

function getBadge(score: number, total: number) {
  if (score >= 80 && total >= 5) return { label: "Trusted", bg: "rgba(34,197,94,0.15)", color: "#22c55e" };
  if (score >= 50) return { label: "Active", bg: "rgba(234,179,8,0.15)", color: "#eab308" };
  return { label: "New", bg: "rgba(107,114,128,0.15)", color: "#6b7280" };
}

export default function AdminContributorsPage() {
  const { loading, authFetch } = useAdmin();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchContributors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("sort", "-reputation_score");

      const res = await authFetch(`/api/v1/admin/contributors?${params.toString()}`);
      const data = await res.json();
      setContributors(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch {
      /* auth redirect handled by hook */
    }
  }, [authFetch, page]);

  useEffect(() => {
    if (loading) return;
    fetchContributors();
  }, [loading, fetchContributors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>Loading...</span>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: "var(--grid-gap)", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <div className="flex items-center gap-[var(--space-3)]">
          <Link href="/admin" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>
            ADMIN
          </Link>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.05em" }}>
            CONTRIBUTORS
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            ({total})
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Contributor</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Badge</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Score</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Approved</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Rejected</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Total</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((c) => {
              const badge = getBadge(c.reputationScore, c.totalSubmissions);
              return (
                <tr key={c.emailHash} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                      {c.emailPreview || c.emailHash.substring(0, 8) + "..."}
                    </span>
                    {c.autoApproveEligible && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", marginLeft: "8px", padding: "1px 4px", borderRadius: "var(--radius-sm)", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontWeight: 600 }}>
                        AUTO
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      background: badge.bg,
                      color: badge.color,
                      fontWeight: 600,
                    }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: c.reputationScore >= 80 ? "#22c55e" : c.reputationScore >= 50 ? "#eab308" : "var(--text-secondary)" }}>
                    {c.reputationScore}%
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center", color: "#22c55e" }}>
                    {c.approvedCount}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center", color: "#ef4444" }}>
                    {c.rejectedCount}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-secondary)" }}>
                    {c.totalSubmissions}
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: "10px", whiteSpace: "nowrap" }}>
                    {c.lastSubmission
                      ? new Date(c.lastSubmission).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {contributors.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                  No contributors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] mt-[var(--grid-gap)]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-[var(--space-2)]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "11px", padding: "4px 12px",
                background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)", color: page <= 1 ? "var(--text-muted)" : "var(--text-secondary)",
                cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "11px", padding: "4px 12px",
                background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)", color: page >= totalPages ? "var(--text-muted)" : "var(--text-secondary)",
                cursor: page >= totalPages ? "default" : "pointer", opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
