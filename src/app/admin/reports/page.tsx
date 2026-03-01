"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useState, useEffect, useCallback } from "react";

interface Report {
  id: string;
  type: string;
  toolSlug: string | null;
  toolName: string | null;
  description: string;
  status: string;
  reporterEmail: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new: { bg: "rgba(234,179,8,0.15)", color: "#eab308" },
  investigating: { bg: "rgba(14,165,233,0.15)", color: "#0ea5e9" },
  fixed: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  closed: { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
  wont_fix: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  data_quality: "Data Quality",
};

export default function AdminReportsPage() {
  const { loading, authFetch } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const pageSize = 20;

  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      params.set("sort", "-createdAt");

      const res = await authFetch(`/api/v1/admin/reports?${params.toString()}`);
      const data = await res.json();
      setReports(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch {
      /* auth redirect handled by hook */
    }
  }, [authFetch, page, statusFilter, typeFilter]);

  useEffect(() => {
    if (loading) return;
    fetchReports();
  }, [loading, fetchReports]);

  async function handleStatusChange(reportId: string, newStatus: string) {
    setUpdatingId(reportId);
    try {
      const res = await authFetch(`/api/v1/admin/reports/${reportId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.error) {
        await fetchReports();
      }
    } catch {
      /* handled */
    }
    setUpdatingId(null);
  }

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
            REPORTS
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            ({total})
          </span>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
          Filters:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            padding: "4px 8px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
          }}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="investigating">Investigating</option>
          <option value="fixed">Fixed</option>
          <option value="closed">Closed</option>
          <option value="wont_fix">Won&apos;t Fix</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            padding: "4px 8px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
          }}
        >
          <option value="">All Types</option>
          <option value="bug">Bug</option>
          <option value="data_quality">Data Quality</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Type</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Tool</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Description</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Date</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => {
              const statusStyle = STATUS_COLORS[r.status] || STATUS_COLORS.new;
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      background: r.type === "bug" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                      color: r.type === "bug" ? "#ef4444" : "#eab308",
                      whiteSpace: "nowrap",
                    }}>
                      {TYPE_LABELS[r.type] || r.type}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.toolName || "General"}</div>
                    {r.toolSlug && (
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{r.toolSlug}</div>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--text-secondary)", maxWidth: "250px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.description}
                    </div>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      disabled={updatingId === r.id}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        border: "none",
                        cursor: updatingId === r.id ? "default" : "pointer",
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        opacity: updatingId === r.id ? 0.5 : 1,
                      }}
                    >
                      <option value="new">new</option>
                      <option value="investigating">investigating</option>
                      <option value="fixed">fixed</option>
                      <option value="closed">closed</option>
                      <option value="wont_fix">wont_fix</option>
                    </select>
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: "10px", whiteSpace: "nowrap" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>
                    <div className="flex items-center justify-end gap-[var(--space-2)]">
                      {r.reporterEmail && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }} title={r.reporterEmail}>
                          @
                        </span>
                      )}
                      {r.reviewedBy && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }} title={`Reviewed by ${r.reviewedBy}`}>
                          R
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                  No reports found.
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
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                padding: "4px 12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: page <= 1 ? "var(--text-muted)" : "var(--text-secondary)",
                cursor: page <= 1 ? "default" : "pointer",
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                padding: "4px 12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: page >= totalPages ? "var(--text-muted)" : "var(--text-secondary)",
                cursor: page >= totalPages ? "default" : "pointer",
                opacity: page >= totalPages ? 0.5 : 1,
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
