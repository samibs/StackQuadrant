"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useState, useEffect, useCallback } from "react";

interface Suggestion {
  id: string;
  type: string;
  toolName: string;
  toolSlug: string | null;
  reason: string;
  status: string;
  submitterEmail: string | null;
  createdAt: string;
  reviewedBy: string | null;
  communityVerified: boolean;
  supportCount: number;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(234,179,8,0.15)", color: "#eab308" },
  approved: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  rejected: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  needs_info: { bg: "rgba(14,165,233,0.15)", color: "#0ea5e9" },
};

const TYPE_LABELS: Record<string, string> = {
  add_tool: "Add Tool",
  move_tool: "Move Tool",
  update_metadata: "Update",
  merge_duplicates: "Merge",
  flag_discontinued: "Discontinue",
};

export default function AdminSuggestionsPage() {
  const { loading, authFetch } = useAdmin();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const pageSize = 20;

  const fetchSuggestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      params.set("sort", "-createdAt");

      const res = await authFetch(`/api/v1/admin/suggestions?${params.toString()}`);
      const data = await res.json();
      setSuggestions(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch {
      /* auth redirect handled by hook */
    }
  }, [authFetch, page, statusFilter, typeFilter]);

  useEffect(() => {
    if (loading) return;
    fetchSuggestions();
  }, [loading, fetchSuggestions]);

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
            SUGGESTIONS
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs_info">Needs Info</option>
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
          <option value="add_tool">Add Tool</option>
          <option value="move_tool">Move Tool</option>
          <option value="update_metadata">Update Metadata</option>
          <option value="merge_duplicates">Merge Duplicates</option>
          <option value="flag_discontinued">Flag Discontinued</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Type</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Tool</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Reason</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Votes</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Date</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => {
              const statusStyle = STATUS_COLORS[s.status] || STATUS_COLORS.pending;
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                    }}>
                      {TYPE_LABELS[s.type] || s.type}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.toolName}</div>
                    {s.toolSlug && (
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.toolSlug}</div>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--text-secondary)", maxWidth: "250px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.reason}
                    </div>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {s.supportCount || 0}
                      </span>
                      {s.communityVerified && (
                        <span style={{ fontSize: 8, color: "#22c55e", fontWeight: 600 }}>VERIFIED</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: "10px", whiteSpace: "nowrap" }}>
                    {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>
                    <Link
                      href={`/admin/suggestions/${s.id}`}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-primary)", textDecoration: "none" }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {suggestions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                  No suggestions found.
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
