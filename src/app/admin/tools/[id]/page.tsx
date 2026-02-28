"use client";

import { useAdmin } from "@/lib/hooks/use-admin";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface ToolForm {
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  category: string;
  vendor: string;
  status: string;
  overallScore: string;
}

const emptyForm: ToolForm = {
  name: "", slug: "", description: "", websiteUrl: "",
  category: "", vendor: "", status: "draft", overallScore: "",
};

export default function AdminToolEditPage() {
  const { loading, authFetch } = useAdmin();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [form, setForm] = useState<ToolForm>(emptyForm);
  const [version, setVersion] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || isNew) return;
    fetchTool();
  }, [loading, isNew]);

  async function fetchTool() {
    try {
      const res = await authFetch(`/api/v1/admin/tools/${id}`);
      const data = await res.json();
      if (data.data) {
        const t = data.data;
        setForm({
          name: t.name || "",
          slug: t.slug || "",
          description: t.description || "",
          websiteUrl: t.websiteUrl || "",
          category: t.category || "",
          vendor: t.vendor || "",
          status: t.status || "draft",
          overallScore: t.overallScore || "",
        });
        setVersion(t.version || 1);
      }
    } catch {}
  }

  function handleChange(field: keyof ToolForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name" && isNew) {
      setForm((prev) => ({
        ...prev,
        [field]: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      }));
    }
  }

  async function handleSubmit() {
    setError("");
    setSaving(true);

    try {
      const url = isNew ? "/api/v1/admin/tools" : `/api/v1/admin/tools/${id}`;
      const method = isNew ? "POST" : "PUT";
      const body = isNew ? form : { ...form, version };

      const res = await authFetch(url, { method, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Save failed");
        return;
      }

      router.push("/admin/tools");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>Loading...</span>
      </div>
    );
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    outline: "none",
  };

  const labelStyle = {
    display: "block" as const,
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "var(--space-1)",
  };

  return (
    <div style={{ padding: "var(--grid-gap)", maxWidth: "700px", margin: "0 auto" }}>
      <div
        className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <div className="flex items-center gap-[var(--space-3)]">
          <Link href="/admin/tools" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>
            TOOLS
          </Link>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            {isNew ? "NEW TOOL" : "EDIT"}
          </span>
        </div>
      </div>

      <div
        style={{ padding: "var(--space-4)", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <div className="flex flex-col gap-[var(--space-3)]">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Slug</label>
              <input style={inputStyle} value={form.slug} onChange={(e) => handleChange("slug", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label style={labelStyle}>Category</label>
              <input style={inputStyle} value={form.category} onChange={(e) => handleChange("category", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Vendor</label>
              <input style={inputStyle} value={form.vendor} onChange={(e) => handleChange("vendor", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label style={labelStyle}>Website URL</label>
              <input style={inputStyle} value={form.websiteUrl} onChange={(e) => handleChange("websiteUrl", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Overall Score</label>
              <input style={inputStyle} type="number" step="0.1" min="0" max="10" value={form.overallScore} onChange={(e) => handleChange("overallScore", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {error && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--score-low)" }}>{error}</p>
          )}

          <div className="flex items-center justify-end gap-[var(--space-2)]">
            <Link
              href="/admin/tools"
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textDecoration: "none", padding: "8px 16px" }}
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                padding: "8px 20px",
                background: "var(--accent-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving..." : isNew ? "Create Tool" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
