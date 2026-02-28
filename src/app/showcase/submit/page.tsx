"use client";

import { useState } from "react";
import { Panel } from "@/components/layout/panel";

interface FormState {
  name: string;
  description: string;
  projectUrl: string;
  githubUrl: string;
  screenshotUrl: string;
  techStack: string;
  aiToolsUsed: string;
  timeToBuild: string;
  builderName: string;
  builderEmail: string;
  builderUrl: string;
}

export default function ShowcaseSubmitPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    projectUrl: "",
    githubUrl: "",
    screenshotUrl: "",
    techStack: "",
    aiToolsUsed: "",
    timeToBuild: "",
    builderName: "",
    builderEmail: "",
    builderUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Array<{ field: string; message: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setErrors([]);

    try {
      const res = await fetch("/api/v1/showcase/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          techStack: form.techStack.split(",").map((s) => s.trim()).filter(Boolean),
          aiToolsUsed: form.aiToolsUsed.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: data.data?.message || "Submitted! Check your email to verify." });
      } else {
        if (data.error?.details) setErrors(data.error.details);
        setResult({ success: false, message: data.error?.message || "Submission failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "12px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-primary)",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-xs)",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-secondary)",
    marginBottom: "4px",
  };

  const fieldError = (field: string) => errors.find((e) => e.field === field)?.message;

  if (result?.success) {
    return (
      <div style={{ padding: "var(--grid-gap)" }}>
        <div
          className="flex flex-col items-center justify-center py-[64px]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--status-success)", marginBottom: "var(--space-2)" }}>
            Submission Received
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", maxWidth: "400px" }}>
            {result.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--grid-gap)", maxWidth: "640px", margin: "0 auto" }}>
      <div
        className="px-[var(--space-3)] py-[var(--space-2)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          Submit to Vibe Coding Showcase
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          Share your AI-built project with the community
        </p>
      </div>

      <Panel title="Project Details">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div>
            <label style={labelStyle}>Project Name *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            {fieldError("name") && <span style={{ fontSize: "10px", color: "var(--status-error)" }}>{fieldError("name")}</span>}
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>

          <div>
            <label style={labelStyle}>Live Project URL *</label>
            <input style={inputStyle} type="url" value={form.projectUrl} onChange={(e) => setForm({ ...form, projectUrl: e.target.value })} placeholder="https://..." required />
          </div>

          <div>
            <label style={labelStyle}>GitHub URL</label>
            <input style={inputStyle} type="url" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/..." />
          </div>

          <div>
            <label style={labelStyle}>Screenshot URL</label>
            <input style={inputStyle} type="url" value={form.screenshotUrl} onChange={(e) => setForm({ ...form, screenshotUrl: e.target.value })} placeholder="https://..." />
          </div>

          <div>
            <label style={labelStyle}>AI Tools Used (comma-separated slugs)</label>
            <input style={inputStyle} value={form.aiToolsUsed} onChange={(e) => setForm({ ...form, aiToolsUsed: e.target.value })} placeholder="claude-code, cursor, copilot" />
          </div>

          <div>
            <label style={labelStyle}>Tech Stack (comma-separated)</label>
            <input style={inputStyle} value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} placeholder="Next.js, TypeScript, PostgreSQL" />
          </div>

          <div>
            <label style={labelStyle}>Time to Build</label>
            <input style={inputStyle} value={form.timeToBuild} onChange={(e) => setForm({ ...form, timeToBuild: e.target.value })} placeholder="2 hours, 3 days, etc." />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-default)" }} />

          <div>
            <label style={labelStyle}>Your Name *</label>
            <input style={inputStyle} value={form.builderName} onChange={(e) => setForm({ ...form, builderName: e.target.value })} required />
          </div>

          <div>
            <label style={labelStyle}>Your Email * (for verification only, not displayed)</label>
            <input style={inputStyle} type="email" value={form.builderEmail} onChange={(e) => setForm({ ...form, builderEmail: e.target.value })} required />
          </div>

          <div>
            <label style={labelStyle}>Your Website / Social</label>
            <input style={inputStyle} type="url" value={form.builderUrl} onChange={(e) => setForm({ ...form, builderUrl: e.target.value })} placeholder="https://..." />
          </div>

          {result && !result.success && (
            <div style={{ padding: "var(--space-2)", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--status-error)", background: "var(--bg-elevated)", borderRadius: "var(--radius-xs)" }}>
              {result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 24px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: "var(--bg-base)",
              background: submitting ? "var(--text-muted)" : "var(--accent-primary)",
              border: "none",
              borderRadius: "var(--radius-xs)",
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Project"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
