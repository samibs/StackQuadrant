"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useEffect, useState } from "react";

interface Tool {
  id: string;
  name: string;
  slug: string;
  category: string;
  vendor: string | null;
  status: string;
  overallScore: string | null;
  updatedAt: string;
}

export default function AdminToolsPage() {
  const { loading, authFetch } = useAdmin();
  const [tools, setTools] = useState<Tool[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    fetchTools();
  }, [loading]);

  async function fetchTools() {
    try {
      const res = await authFetch("/api/v1/admin/tools");
      const data = await res.json();
      setTools(data.data || []);
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tool? This action cannot be undone.")) return;
    setDeleting(id);
    try {
      await authFetch(`/api/v1/admin/tools/${id}`, { method: "DELETE" });
      setTools((prev) => prev.filter((t) => t.id !== id));
    } catch {}
    setDeleting(null);
  }

  async function handleToggleStatus(tool: Tool) {
    const newStatus = tool.status === "published" ? "draft" : "published";
    try {
      await authFetch(`/api/v1/admin/tools/${tool.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTools();
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--grid-gap)", maxWidth: "1000px", margin: "0 auto" }}>
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
            TOOLS
          </span>
        </div>
        <Link
          href="/admin/tools/new"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            padding: "4px 12px",
            background: "var(--accent-primary)",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          + New Tool
        </Link>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Name</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Category</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Score</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={tool.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                <td style={{ padding: "8px 12px" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{tool.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{tool.vendor}</div>
                </td>
                <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{tool.category}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: tool.overallScore && parseFloat(tool.overallScore) >= 8 ? "var(--score-high)" : "var(--text-primary)" }}>
                  {tool.overallScore || "-"}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  <button
                    onClick={() => handleToggleStatus(tool)}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      cursor: "pointer",
                      background: tool.status === "published" ? "rgba(34,197,94,0.15)" : "var(--bg-elevated)",
                      color: tool.status === "published" ? "var(--score-high)" : "var(--text-muted)",
                    }}
                  >
                    {tool.status}
                  </button>
                </td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>
                  <div className="flex items-center justify-end gap-[var(--space-2)]">
                    <Link
                      href={`/admin/tools/${tool.id}`}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-primary)", textDecoration: "none" }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(tool.id)}
                      disabled={deleting === tool.id}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--score-low)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        opacity: deleting === tool.id ? 0.5 : 1,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tools.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                  No tools yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
