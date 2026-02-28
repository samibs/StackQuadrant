"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useEffect, useState } from "react";

interface Quadrant {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
}

export default function AdminQuadrantsPage() {
  const { loading, authFetch } = useAdmin();
  const [items, setItems] = useState<Quadrant[]>([]);

  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        const res = await authFetch("/api/v1/admin/quadrants");
        const data = await res.json();
        setItems(data.data || []);
      } catch {}
    })();
  }, [loading, authFetch]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this quadrant?")) return;
    try {
      await authFetch(`/api/v1/admin/quadrants/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((q) => q.id !== id));
    } catch {}
  }

  if (loading) return null;

  return (
    <div style={{ padding: "var(--grid-gap)", maxWidth: "900px", margin: "0 auto" }}>
      <div
        className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <div className="flex items-center gap-[var(--space-3)]">
          <Link href="/admin" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>ADMIN</Link>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>QUADRANTS</span>
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Title</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text-primary)" }}>{q.title}</td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "var(--radius-sm)", background: q.status === "published" ? "rgba(34,197,94,0.15)" : "var(--bg-elevated)", color: q.status === "published" ? "var(--score-high)" : "var(--text-muted)" }}>
                    {q.status}
                  </span>
                </td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>
                  <button onClick={() => handleDelete(q.id)} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--score-low)", background: "none", border: "none", cursor: "pointer" }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>No quadrants yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
