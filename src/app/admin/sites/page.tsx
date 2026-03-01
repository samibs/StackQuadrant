"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useState, useEffect, useCallback } from "react";

interface RegisteredSite {
  id: string;
  name: string;
  origin: string;
  mcpConfig: Record<string, unknown>;
  active: boolean;
  createdAt: string;
}

export default function AdminSitesPage() {
  const { loading, authFetch } = useAdmin();
  const [sites, setSites] = useState<RegisteredSite[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ id: "", name: "", origin: "", active: true });
  const [saving, setSaving] = useState(false);

  const fetchSites = useCallback(async () => {
    try {
      const res = await authFetch("/api/v1/admin/sites");
      if (res.ok) {
        const data = await res.json();
        setSites(data.data || []);
      }
    } catch {}
  }, [authFetch]);

  useEffect(() => {
    if (!loading) fetchSites();
  }, [loading, fetchSites]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await authFetch(`/api/v1/admin/sites/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name, origin: formData.origin, active: formData.active }),
        });
        if (res.ok) {
          setShowForm(false);
          setEditingId(null);
          fetchSites();
        }
      } else {
        const res = await authFetch("/api/v1/admin/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setShowForm(false);
          fetchSites();
        }
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (id === "stackquadrant") return;
    try {
      const res = await authFetch(`/api/v1/admin/sites/${id}`, { method: "DELETE" });
      if (res.ok) fetchSites();
    } catch {}
  };

  const handleEdit = (site: RegisteredSite) => {
    setEditingId(site.id);
    setFormData({ id: site.id, name: site.name, origin: site.origin, active: site.active });
    setShowForm(true);
  };

  if (loading) return null;

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <div>
          <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "var(--space-1)" }}>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none" }}>ADMIN</Link> / REGISTERED SITES
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            Registered Sites
          </h1>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData({ id: "", name: "", origin: "", active: true }); setShowForm(true); }}
          style={{
            padding: "var(--space-2) var(--space-4)",
            background: "var(--accent-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
          }}
        >
          + Add Site
        </button>
      </div>

      {showForm && (
        <div style={{
          padding: "var(--space-4)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          marginBottom: "var(--space-4)",
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)", marginBottom: "var(--space-3)" }}>
            {editingId ? "Edit Site" : "Register New Site"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label style={labelStyle}>Site ID</label>
              <input
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                disabled={!!editingId}
                placeholder="e.g., frontaliercalc"
                style={{ ...inputStyle, opacity: editingId ? 0.5 : 1 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Display Name</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., FrontalierCalc"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Origin URL</label>
              <input
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="e.g., https://frontaliercalc.com"
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-2)" }}>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                Active
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <button onClick={handleSave} disabled={saving || !formData.id || !formData.name || !formData.origin} style={{
              padding: "var(--space-1) var(--space-4)",
              background: "var(--accent-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{
              padding: "var(--space-1) var(--space-4)",
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Origin</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                <td style={tdStyle}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>{site.id}</span>
                </td>
                <td style={tdStyle}>{site.name}</td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{site.origin}</span>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    background: site.active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    color: site.active ? "#22c55e" : "#ef4444",
                  }}>
                    {site.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button onClick={() => handleEdit(site)} style={actionBtnStyle}>Edit</button>
                    {site.id !== "stackquadrant" && (
                      <button onClick={() => handleDelete(site.id)} style={{ ...actionBtnStyle, color: "#ef4444" }}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sites.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "var(--text-muted)" }}>
                  No registered sites
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 600,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "var(--space-1)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-2)",
  background: "var(--bg-input)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: 12,
  fontFamily: "var(--font-mono)",
};

const thStyle: React.CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  textAlign: "left",
  fontSize: 10,
  fontWeight: 600,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  fontSize: 12,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-mono)",
};

const actionBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--accent-primary)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  cursor: "pointer",
  padding: "2px 4px",
};
