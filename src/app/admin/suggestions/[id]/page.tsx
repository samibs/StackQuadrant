"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Suggestion {
  id: string;
  type: string;
  toolName: string;
  toolSlug: string | null;
  reason: string;
  status: string;
  submitterEmail: string | null;
  proposedQuadrant: string | null;
  evidence: string[];
  context: Record<string, unknown> | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SimilarSuggestion {
  id: string;
  type: string;
  toolName: string;
  status: string;
  reason: string;
  createdAt: string;
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
  update_metadata: "Update Metadata",
  merge_duplicates: "Merge Duplicates",
  flag_discontinued: "Flag Discontinued",
};

export default function AdminSuggestionDetailPage() {
  const { loading, authFetch } = useAdmin();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [similarSuggestions, setSimilarSuggestions] = useState<SimilarSuggestion[]>([]);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoQuestion, setInfoQuestion] = useState("");

  const fetchSuggestion = useCallback(async () => {
    try {
      const res = await authFetch(`/api/v1/admin/suggestions/${id}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error.message || "Failed to load suggestion");
        return;
      }
      setSuggestion(data.data.suggestion);
      setSimilarSuggestions(data.data.similarSuggestions || []);
    } catch {
      setError("Failed to load suggestion");
    }
  }, [authFetch, id]);

  useEffect(() => {
    if (loading) return;
    fetchSuggestion();
  }, [loading, fetchSuggestion]);

  async function handleApprove() {
    if (!confirm("Approve this suggestion? A change job will be created.")) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/v1/admin/suggestions/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error.message || "Failed to approve");
      } else {
        await fetchSuggestion();
      }
    } catch {
      alert("Failed to approve suggestion");
    }
    setActionLoading(false);
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/v1/admin/suggestions/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error.message || "Failed to reject");
      } else {
        setShowRejectModal(false);
        setRejectReason("");
        await fetchSuggestion();
      }
    } catch {
      alert("Failed to reject suggestion");
    }
    setActionLoading(false);
  }

  async function handleRequestInfo() {
    if (!infoQuestion.trim()) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/v1/admin/suggestions/${id}/request-info`, {
        method: "POST",
        body: JSON.stringify({ question: infoQuestion.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error.message || "Failed to request info");
      } else {
        setShowInfoModal(false);
        setInfoQuestion("");
        await fetchSuggestion();
      }
    } catch {
      alert("Failed to request info");
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--grid-gap)", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "var(--space-4)", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--score-low)" }}>{error}</p>
          <Link href="/admin/suggestions" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)", textDecoration: "none", marginTop: "var(--space-3)", display: "inline-block" }}>
            Back to Suggestions
          </Link>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>Loading suggestion...</span>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[suggestion.status] || STATUS_COLORS.pending;
  const canAct = suggestion.status === "pending" || suggestion.status === "needs_info";

  return (
    <div style={{ padding: "var(--grid-gap)", maxWidth: "800px", margin: "0 auto" }}>
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
          <Link href="/admin/suggestions" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>
            SUGGESTIONS
          </Link>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.05em" }}>
            DETAIL
          </span>
        </div>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          padding: "2px 8px",
          borderRadius: "var(--radius-sm)",
          background: statusStyle.bg,
          color: statusStyle.color,
          fontWeight: 600,
        }}>
          {suggestion.status.toUpperCase()}
        </span>
      </div>

      {/* Main info */}
      <div
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "var(--space-4)", marginBottom: "var(--grid-gap)" }}
      >
        <div className="flex items-center gap-[var(--space-3)]" style={{ marginBottom: "var(--space-4)" }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
          }}>
            {TYPE_LABELS[suggestion.type] || suggestion.type}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            {suggestion.toolName}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 16px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Tool Slug:</span>
          <span style={{ color: "var(--text-secondary)" }}>{suggestion.toolSlug || "N/A"}</span>

          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Submitter:</span>
          <span style={{ color: "var(--text-secondary)" }}>{suggestion.submitterEmail || "Anonymous"}</span>

          {suggestion.proposedQuadrant && (
            <>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Quadrant:</span>
              <span style={{ color: "var(--text-secondary)" }}>{suggestion.proposedQuadrant}</span>
            </>
          )}

          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Submitted:</span>
          <span style={{ color: "var(--text-secondary)" }}>{new Date(suggestion.createdAt).toLocaleString()}</span>

          {suggestion.reviewedBy && (
            <>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Reviewed By:</span>
              <span style={{ color: "var(--text-secondary)" }}>{suggestion.reviewedBy}</span>
            </>
          )}
        </div>
      </div>

      {/* Reason */}
      <div
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "var(--space-4)", marginBottom: "var(--grid-gap)" }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}>
          Reason
        </span>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
          {suggestion.reason}
        </p>
      </div>

      {/* Evidence */}
      {suggestion.evidence && suggestion.evidence.length > 0 && (
        <div
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "var(--space-4)", marginBottom: "var(--grid-gap)" }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}>
            Evidence Links
          </span>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {suggestion.evidence.map((url, i) => (
              <li key={i} style={{ marginBottom: "4px" }}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)", textDecoration: "none", wordBreak: "break-all" }}
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Context / Diff preview */}
      {suggestion.context && Object.keys(suggestion.context).length > 0 && (
        <div
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "var(--space-4)", marginBottom: "var(--grid-gap)" }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}>
            Proposed Changes
          </span>
          <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "12px", overflow: "auto" }}>
            {Object.entries(suggestion.context).map(([key, val]) => {
              const value = val as { old?: unknown; new?: unknown } | unknown;
              const isChange = typeof value === "object" && value !== null && "new" in (value as Record<string, unknown>);
              return (
                <div key={key} style={{ marginBottom: "8px", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{key}:</span>
                  {isChange ? (
                    <div style={{ marginLeft: "16px", marginTop: "2px" }}>
                      {(value as { old?: unknown }).old !== undefined && (
                        <div style={{ color: "#ef4444" }}>
                          - {String((value as { old?: unknown }).old)}
                        </div>
                      )}
                      <div style={{ color: "#22c55e" }}>
                        + {String((value as { new: unknown }).new)}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>
                      {JSON.stringify(value)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin notes / Rejection reason */}
      {(suggestion.adminNotes || suggestion.rejectionReason) && (
        <div
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "var(--space-4)", marginBottom: "var(--grid-gap)" }}
        >
          {suggestion.rejectionReason && (
            <>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: "#ef4444", textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}>
                Rejection Reason
              </span>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.6, margin: 0, marginBottom: suggestion.adminNotes ? "var(--space-4)" : 0, whiteSpace: "pre-wrap" }}>
                {suggestion.rejectionReason}
              </p>
            </>
          )}
          {suggestion.adminNotes && (
            <>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}>
                Admin Notes
              </span>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                {suggestion.adminNotes}
              </p>
            </>
          )}
        </div>
      )}

      {/* Similar suggestions */}
      {similarSuggestions.length > 0 && (
        <div
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "var(--space-4)", marginBottom: "var(--grid-gap)" }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}>
            Similar Suggestions ({similarSuggestions.length})
          </span>
          {similarSuggestions.map((sim) => {
            const simStatus = STATUS_COLORS[sim.status] || STATUS_COLORS.pending;
            return (
              <div
                key={sim.id}
                className="flex items-center justify-between"
                style={{ padding: "6px 0", borderBottom: "1px solid var(--border-default)" }}
              >
                <div>
                  <Link
                    href={`/admin/suggestions/${sim.id}`}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}
                  >
                    {sim.toolName}
                  </Link>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginLeft: "8px" }}>
                    {TYPE_LABELS[sim.type] || sim.type}
                  </span>
                </div>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-sm)",
                  background: simStatus.bg,
                  color: simStatus.color,
                }}>
                  {sim.status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {canAct && (
        <div
          className="flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", marginBottom: "var(--grid-gap)" }}
        >
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "6px 16px",
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: "var(--radius-sm)",
              color: "#22c55e",
              cursor: actionLoading ? "default" : "pointer",
              fontWeight: 600,
              opacity: actionLoading ? 0.5 : 1,
            }}
          >
            Approve
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={actionLoading}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "6px 16px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "var(--radius-sm)",
              color: "#ef4444",
              cursor: actionLoading ? "default" : "pointer",
              fontWeight: 600,
              opacity: actionLoading ? 0.5 : 1,
            }}
          >
            Reject
          </button>
          {suggestion.submitterEmail && suggestion.status === "pending" && (
            <button
              onClick={() => setShowInfoModal(true)}
              disabled={actionLoading}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                padding: "6px 16px",
                background: "rgba(14,165,233,0.15)",
                border: "1px solid rgba(14,165,233,0.3)",
                borderRadius: "var(--radius-sm)",
                color: "#0ea5e9",
                cursor: actionLoading ? "default" : "pointer",
                fontWeight: 600,
                opacity: actionLoading ? 0.5 : 1,
              }}
            >
              Request Info
            </button>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-4)",
              width: "100%",
              maxWidth: "480px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "var(--space-3)" }}>
              Reject Suggestion
            </span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)"
              rows={4}
              style={{
                width: "100%",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                padding: "8px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                resize: "vertical",
                marginBottom: "var(--space-3)",
                boxSizing: "border-box",
              }}
            />
            <div className="flex items-center justify-end gap-[var(--space-2)]">
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "6px 12px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "6px 12px",
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "var(--radius-sm)",
                  color: "#ef4444",
                  cursor: !rejectReason.trim() || actionLoading ? "default" : "pointer",
                  fontWeight: 600,
                  opacity: !rejectReason.trim() || actionLoading ? 0.5 : 1,
                }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {showInfoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowInfoModal(false)}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-4)",
              width: "100%",
              maxWidth: "480px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "var(--space-3)" }}>
              Request Additional Info
            </span>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
              An email will be sent to {suggestion.submitterEmail}
            </p>
            <textarea
              value={infoQuestion}
              onChange={(e) => setInfoQuestion(e.target.value)}
              placeholder="What additional information do you need?"
              rows={4}
              style={{
                width: "100%",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                padding: "8px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                resize: "vertical",
                marginBottom: "var(--space-3)",
                boxSizing: "border-box",
              }}
            />
            <div className="flex items-center justify-end gap-[var(--space-2)]">
              <button
                onClick={() => setShowInfoModal(false)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "6px 12px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInfo}
                disabled={!infoQuestion.trim() || actionLoading}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "6px 12px",
                  background: "rgba(14,165,233,0.15)",
                  border: "1px solid rgba(14,165,233,0.3)",
                  borderRadius: "var(--radius-sm)",
                  color: "#0ea5e9",
                  cursor: !infoQuestion.trim() || actionLoading ? "default" : "pointer",
                  fontWeight: 600,
                  opacity: !infoQuestion.trim() || actionLoading ? 0.5 : 1,
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
