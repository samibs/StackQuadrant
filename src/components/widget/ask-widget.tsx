"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "isomorphic-dompurify";

type WidgetMode = "ask" | "suggest" | "report";
type SuggestType = "add_tool" | "move_tool" | "update_metadata" | "merge_duplicates" | "flag_discontinued";
type ReportType = "bug" | "data_quality";
type UserRole = "user" | "vendor" | "observer";

interface AskResponse {
  recommendation: {
    toolSlug: string;
    toolName: string;
    quadrant: string;
    confidence: string;
  };
  rationale: string[];
  alternatives: Array<{ toolSlug: string; toolName: string; reason: string }>;
  confidence: "high" | "medium" | "low";
  confidenceDetails?: { level: string; score: number; factors: string[] } | null;
  sources: string[];
}

interface DuplicateSuggestion {
  id: string;
  type: string;
  toolName: string;
  toolSlug: string | null;
  proposedQuadrant: string | null;
  reason: string;
  supportCount: number;
  communityVerified: boolean;
  createdAt: string;
}

interface ToolAutoComplete {
  name: string;
  slug: string;
}

const QUICK_PROMPTS = [
  "Where does Cursor fit and why?",
  "Compare Copilot vs Cursor for rapid prototyping",
  "What changed recently in the AI coding space?",
  "Best tool for full-stack development?",
];

const SUGGEST_TYPES: Array<{ value: SuggestType; label: string; icon: string }> = [
  { value: "add_tool", label: "Add a tool", icon: "+" },
  { value: "move_tool", label: "Move a tool", icon: "↗" },
  { value: "update_metadata", label: "Update info", icon: "✎" },
  { value: "merge_duplicates", label: "Merge duplicates", icon: "⊕" },
  { value: "flag_discontinued", label: "Flag discontinued", icon: "⚑" },
];

export function AskWidget({ toolContext }: { toolContext?: { slug: string; name: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<WidgetMode>("ask");
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const [eventToolContext, setEventToolContext] = useState<{ slug: string; name: string } | undefined>(toolContext);

  const openSuggestWithTool = useCallback((toolSlug?: string, toolName?: string) => {
    if (toolSlug && toolName) {
      setEventToolContext({ slug: toolSlug, name: toolName });
    }
    setMode("suggest");
    setIsOpen(true);
  }, []);

  // Listen for "Suggest a correction" events from tool pages
  useEffect(() => {
    function handleSuggestEvent(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.slug && detail?.name) {
        openSuggestWithTool(detail.slug, detail.name);
      }
    }
    window.addEventListener("sq-open-suggest", handleSuggestEvent);
    return () => window.removeEventListener("sq-open-suggest", handleSuggestEvent);
  }, [openSuggestWithTool]);

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open Ask + Suggest + Report widget"
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--accent-primary)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              zIndex: 1000,
            }}
          >
            💬
          </motion.button>
        )}
      </AnimatePresence>

      {/* Widget panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="widget-panel"
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 420,
              maxHeight: 600,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1001,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-3) var(--space-4)",
              borderBottom: "1px solid var(--border-default)",
              background: "var(--bg-elevated)",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                StackQuadrant
              </span>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close widget"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Tab bar */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
            }}>
              {(["ask", "suggest", "report"] as WidgetMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "var(--space-2) var(--space-3)",
                    background: mode === m ? "var(--bg-elevated)" : "transparent",
                    color: mode === m ? "var(--accent-primary)" : "var(--text-muted)",
                    border: "none",
                    borderBottom: mode === m ? "2px solid var(--accent-primary)" : "2px solid transparent",
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    fontWeight: mode === m ? 600 : 400,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    transition: "all 0.15s",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div style={{ flex: 1, overflow: "auto", minHeight: 300 }}>
              {mode === "ask" && <AskMode onDisagree={(toolSlug, toolName) => { openSuggestWithTool(toolSlug, toolName); }} />}
              {mode === "suggest" && <SuggestMode toolContext={eventToolContext} />}
              {mode === "report" && <ReportMode />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── ASK MODE ──────────────────────────────────────────

function AskMode({ onDisagree }: { onDisagree: (toolSlug?: string, toolName?: string) => void }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch("/api/v1/widget/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, context: { pageUrl: window.location.pathname } }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to get response");
      }
      const data = await res.json();
      setResponse(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Quick prompts or response area */}
      <div style={{ flex: 1, padding: "var(--space-4)", overflow: "auto" }}>
        {!response && !loading && !error && (
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
              Ask about AI developer tools, quadrant positions, or get stack recommendations.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setQuestion(prompt); handleAsk(prompt); }}
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    textAlign: "left",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 16,
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                  animation: "pulse 1.5s ease-in-out infinite",
                  width: `${90 - i * 15}%`,
                }}
              />
            ))}
          </div>
        )}

        {error && (
          <div style={{
            padding: "var(--space-3)",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "#ef4444",
            fontSize: 11,
          }}>
            <p>{error}</p>
            <button
              onClick={() => handleAsk(question)}
              style={{
                marginTop: "var(--space-2)",
                padding: "var(--space-1) var(--space-3)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {response && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {/* Recommendation */}
            <div style={{
              padding: "var(--space-3)",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-sm)",
              borderLeft: "3px solid var(--accent-primary)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Recommendation
                </span>
                <span
                  title={response.confidenceDetails?.factors?.join(" | ") || ""}
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: "var(--radius-full)",
                    background: response.confidence === "high" ? "rgba(34,197,94,0.15)" : response.confidence === "medium" ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.15)",
                    color: response.confidence === "high" ? "var(--score-high)" : response.confidence === "medium" ? "var(--score-mid)" : "var(--score-low)",
                    cursor: "help",
                  }}>
                  {response.confidence} confidence
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                {response.recommendation.toolName}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {response.recommendation.quadrant} quadrant
              </p>
            </div>

            {/* Rationale */}
            <div>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Rationale
              </span>
              <ul style={{ margin: "var(--space-2) 0 0 var(--space-4)", padding: 0, listStyle: "disc" }}>
                {response.rationale.map((r, i) => (
                  <li key={i} style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: "var(--space-1)" }}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Alternatives */}
            {response.alternatives.length > 0 && (
              <div>
                <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Alternatives
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", marginTop: "var(--space-2)" }}>
                  {response.alternatives.map((alt) => (
                    <div key={alt.toolSlug} style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent-primary)", fontWeight: 500 }}>{alt.toolName}</span>
                      {" — "}{alt.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disagree button */}
            <button
              onClick={() => onDisagree(response.recommendation.toolSlug, response.recommendation.toolName)}
              style={{
                padding: "var(--space-2) var(--space-3)",
                background: "transparent",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                textAlign: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--score-mid)";
                e.currentTarget.style.color = "var(--score-mid)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              Disagree? Suggest a correction →
            </button>

            {/* New question */}
            <button
              onClick={() => { setResponse(null); setQuestion(""); }}
              style={{
                padding: "var(--space-1) var(--space-3)",
                background: "none",
                border: "none",
                color: "var(--accent-primary)",
                cursor: "pointer",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            >
              Ask another question
            </button>
          </div>
        )}
      </div>

      {/* Input bar */}
      {!response && (
        <div style={{
          padding: "var(--space-3) var(--space-4)",
          borderTop: "1px solid var(--border-default)",
          display: "flex",
          gap: "var(--space-2)",
        }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAsk(question); }}
            placeholder="Ask about tools, quadrants, stacks..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "var(--space-2) var(--space-3)",
              background: "var(--bg-input)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              outline: "none",
            }}
            maxLength={500}
          />
          <button
            onClick={() => handleAsk(question)}
            disabled={loading || !question.trim()}
            style={{
              padding: "var(--space-2) var(--space-3)",
              background: "var(--accent-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: loading || !question.trim() ? "not-allowed" : "pointer",
              opacity: loading || !question.trim() ? 0.5 : 1,
              fontSize: 12,
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SUGGEST MODE ──────────────────────────────────────

function SuggestMode({ toolContext }: { toolContext?: { slug: string; name: string } }) {
  const [suggestType, setSuggestType] = useState<SuggestType | null>(null);
  const [toolName, setToolName] = useState(toolContext?.name || "");
  const [toolSlug, setToolSlug] = useState(toolContext?.slug || "");
  const [proposedQuadrant, setProposedQuadrant] = useState("");
  const [reason, setReason] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([""]);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolSuggestions, setToolSuggestions] = useState<ToolAutoComplete[]>([]);
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateSuggestion[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [supportingId, setSupportingId] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Tool autocomplete
  useEffect(() => {
    if (toolName.length < 2) { setToolSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/tools?search=${encodeURIComponent(toolName)}&pageSize=5`);
        if (res.ok) {
          const data = await res.json();
          setToolSuggestions((data.data || []).map((t: { name: string; slug: string }) => ({ name: t.name, slug: t.slug })));
          setShowToolDropdown(true);
        }
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [toolName]);

  // Duplicate detection when type + tool name are set
  useEffect(() => {
    if (!suggestType || toolName.length < 2) { setDuplicates([]); return; }
    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const params = new URLSearchParams({ toolName, type: suggestType });
        if (toolSlug) params.set("toolSlug", toolSlug);
        const res = await fetch(`/api/v1/widget/suggest/check-duplicate?${params}`);
        if (res.ok) {
          const data = await res.json();
          setDuplicates(data.data?.similar || []);
        }
      } catch { /* ignore */ }
      setCheckingDuplicates(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [suggestType, toolName, toolSlug]);

  const handleSupport = async (suggestionId: string) => {
    setSupportingId(suggestionId);
    try {
      const res = await fetch("/api/v1/widget/suggest/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId,
          email: submitterEmail || undefined,
          evidence: reason || undefined,
        }),
      });
      if (res.ok) {
        setSupportSuccess(true);
      } else {
        const err = await res.json();
        setError(err.error?.message || "Failed to add support");
      }
    } catch {
      setError("Failed to add support vote");
    }
    setSupportingId(null);
  };

  const addEvidenceLink = () => {
    if (evidenceLinks.length < 3) setEvidenceLinks([...evidenceLinks, ""]);
  };

  const removeEvidenceLink = (idx: number) => {
    setEvidenceLinks(evidenceLinks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!suggestType || !toolName.trim() || !reason.trim()) return;

    const requiresEvidence = suggestType === "move_tool" || suggestType === "flag_discontinued";
    const validLinks = evidenceLinks.filter((l) => l.trim());
    if (requiresEvidence && validLinks.length === 0) {
      setError("At least one evidence link is required for this suggestion type.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/widget/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: suggestType,
          toolName: DOMPurify.sanitize(toolName.trim()),
          toolSlug: toolSlug || undefined,
          proposedQuadrant: proposedQuadrant || undefined,
          reason: DOMPurify.sanitize(reason.trim()),
          evidenceLinks: validLinks,
          tags: [],
          userRole,
          submitterEmail: submitterEmail || undefined,
          context: {
            pageUrl: window.location.pathname,
            toolCardId: toolContext?.slug,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Submission failed");
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (supportSuccess) {
    return (
      <div style={{ padding: "var(--space-6) var(--space-4)", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: "var(--space-3)" }}>✓</div>
        <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, marginBottom: "var(--space-2)" }}>
          Support added
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Your voice has been added to the existing suggestion. Thank you!
        </p>
        <button
          onClick={() => { setSupportSuccess(false); setSuggestType(null); setToolName(""); setReason(""); setDuplicates([]); }}
          style={{
            marginTop: "var(--space-4)",
            padding: "var(--space-2) var(--space-4)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 11,
          }}
        >
          Done
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ padding: "var(--space-6) var(--space-4)", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: "var(--space-3)" }}>✓</div>
        <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, marginBottom: "var(--space-2)" }}>
          Suggestion submitted
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Our team will review your suggestion. Thank you for helping improve StackQuadrant.
        </p>
        <button
          onClick={() => { setSuccess(false); setSuggestType(null); setToolName(""); setReason(""); setEvidenceLinks([""]); setDuplicates([]); }}
          style={{
            marginTop: "var(--space-4)",
            padding: "var(--space-2) var(--space-4)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 11,
          }}
        >
          Submit another
        </button>
      </div>
    );
  }

  // Type selection
  if (!suggestType) {
    return (
      <div style={{ padding: "var(--space-4)" }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
          What kind of change are you suggesting?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {SUGGEST_TYPES.map((st) => (
            <button
              key={st.value}
              onClick={() => setSuggestType(st.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                textAlign: "left",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
            >
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{st.icon}</span>
              {st.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Suggestion form
  return (
    <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <button
        onClick={() => setSuggestType(null)}
        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 10, textAlign: "left", padding: 0 }}
      >
        ← Back to types
      </button>

      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
        {SUGGEST_TYPES.find((t) => t.value === suggestType)?.label}
      </div>

      {/* Tool name with autocomplete */}
      <div style={{ position: "relative" }}>
        <label style={labelStyle}>Tool name *</label>
        <input
          type="text"
          value={toolName}
          onChange={(e) => { setToolName(e.target.value); setToolSlug(""); }}
          onFocus={() => toolSuggestions.length > 0 && setShowToolDropdown(true)}
          onBlur={() => setTimeout(() => setShowToolDropdown(false), 200)}
          placeholder="e.g. Cursor, GitHub Copilot"
          maxLength={200}
          style={inputStyle}
        />
        {showToolDropdown && toolSuggestions.length > 0 && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            zIndex: 10,
            maxHeight: 120,
            overflow: "auto",
          }}>
            {toolSuggestions.map((t) => (
              <div
                key={t.slug}
                onMouseDown={() => { setToolName(t.name); setToolSlug(t.slug); setShowToolDropdown(false); }}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  cursor: "pointer",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-input)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {t.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duplicate detection card */}
      {checkingDuplicates && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic" }}>
          Checking for similar suggestions...
        </div>
      )}
      {duplicates.length > 0 && !checkingDuplicates && (
        <div style={{
          padding: "var(--space-3)",
          background: "rgba(234,179,8,0.08)",
          border: "1px solid rgba(234,179,8,0.3)",
          borderRadius: "var(--radius-sm)",
        }}>
          <p style={{ fontSize: 10, color: "var(--score-mid)", fontWeight: 600, marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Similar suggestion exists
          </p>
          <div style={{
            padding: "var(--space-2)",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-2)",
          }}>
            <p style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 500 }}>
              {duplicates[0].toolName} — {duplicates[0].reason.slice(0, 80)}{duplicates[0].reason.length > 80 ? "..." : ""}
            </p>
            <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                {duplicates[0].supportCount} supporter{duplicates[0].supportCount !== 1 ? "s" : ""}
              </span>
              {duplicates[0].communityVerified && (
                <span style={{ fontSize: 9, color: "var(--score-high)" }}>✓ Community verified</span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button
              onClick={() => handleSupport(duplicates[0].id)}
              disabled={!!supportingId}
              style={{
                flex: 1,
                padding: "var(--space-1) var(--space-2)",
                background: "var(--accent-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: supportingId ? "not-allowed" : "pointer",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            >
              {supportingId === duplicates[0].id ? "Adding..." : "Support this suggestion"}
            </button>
            <button
              onClick={() => setDuplicates([])}
              style={{
                padding: "var(--space-1) var(--space-2)",
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            >
              Submit new
            </button>
          </div>
        </div>
      )}

      {/* Proposed quadrant (for move_tool) */}
      {suggestType === "move_tool" && (
        <div>
          <label style={labelStyle}>Proposed quadrant</label>
          <select
            value={proposedQuadrant}
            onChange={(e) => setProposedQuadrant(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">Select quadrant</option>
            <option value="Leaders">Leaders</option>
            <option value="Visionaries">Visionaries</option>
            <option value="Challengers">Challengers</option>
            <option value="Niche Players">Niche Players</option>
          </select>
        </div>
      )}

      {/* Reason */}
      <div>
        <label style={labelStyle}>Reason *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why should this change be made?"
          maxLength={2000}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
        />
        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{reason.length}/2000</span>
      </div>

      {/* Evidence links */}
      <div>
        <label style={labelStyle}>
          Evidence links {(suggestType === "move_tool" || suggestType === "flag_discontinued") ? "*" : "(optional)"}
        </label>
        {evidenceLinks.map((link, idx) => (
          <div key={idx} style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
            <input
              type="url"
              value={link}
              onChange={(e) => {
                const newLinks = [...evidenceLinks];
                newLinks[idx] = e.target.value;
                setEvidenceLinks(newLinks);
              }}
              placeholder="https://..."
              style={{ ...inputStyle, flex: 1 }}
            />
            {evidenceLinks.length > 1 && (
              <button onClick={() => removeEvidenceLink(idx)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>
                ×
              </button>
            )}
          </div>
        ))}
        {evidenceLinks.length < 3 && (
          <button onClick={addEvidenceLink} style={{ background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer", fontSize: 10, padding: 0 }}>
            + Add link
          </button>
        )}
      </div>

      {/* User role */}
      <div>
        <label style={labelStyle}>I am a...</label>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {(["user", "vendor", "observer"] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setUserRole(r)}
              style={{
                flex: 1,
                padding: "var(--space-1) var(--space-2)",
                background: userRole === r ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: userRole === r ? "#fff" : "var(--text-muted)",
                border: "1px solid " + (userRole === r ? "var(--accent-primary)" : "var(--border-default)"),
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                textTransform: "capitalize",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Email (optional) */}
      <div>
        <label style={labelStyle}>Email (optional, for follow-up)</label>
        <input
          type="email"
          value={submitterEmail}
          onChange={(e) => setSubmitterEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={320}
          style={inputStyle}
        />
      </div>

      {error && (
        <div style={{ fontSize: 11, color: "#ef4444", padding: "var(--space-2)", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-sm)" }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !toolName.trim() || !reason.trim()}
        style={{
          padding: "var(--space-2) var(--space-4)",
          background: "var(--accent-primary)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting || !toolName.trim() || !reason.trim() ? 0.5 : 1,
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
        }}
      >
        {submitting ? "Submitting..." : "Submit suggestion"}
      </button>
    </div>
  );
}

// ─── REPORT MODE ──────────────────────────────────────

function ReportMode() {
  const [reportType, setReportType] = useState<ReportType>("bug");
  const [description, setDescription] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [page, setPage] = useState("");
  const [toolSlug, setToolSlug] = useState("");
  const [fieldReference, setFieldReference] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [correctedValue, setCorrectedValue] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("screenshot", file);
      const res = await fetch("/api/v1/widget/report/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Upload failed");
      }
      const data = await res.json();
      setScreenshotUrl(data.data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        type: reportType,
        description: DOMPurify.sanitize(description.trim()),
        submitterEmail: submitterEmail || undefined,
        context: { pageUrl: window.location.pathname, browser: navigator.userAgent },
      };
      if (reportType === "bug") {
        body.page = page || undefined;
        body.expectedResult = expectedResult || undefined;
        body.screenshotUrl = screenshotUrl || undefined;
      } else {
        body.toolSlug = toolSlug || undefined;
        body.fieldReference = fieldReference || undefined;
        body.currentValue = currentValue || undefined;
        body.correctedValue = correctedValue || undefined;
        body.evidenceLink = evidenceLink || undefined;
      }
      const res = await fetch("/api/v1/widget/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Submission failed");
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: "var(--space-6) var(--space-4)", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: "var(--space-3)" }}>✓</div>
        <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, marginBottom: "var(--space-2)" }}>
          Report submitted
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Thank you for helping improve StackQuadrant.
        </p>
        <button
          onClick={() => { setSuccess(false); setDescription(""); setExpectedResult(""); }}
          style={{
            marginTop: "var(--space-4)",
            padding: "var(--space-2) var(--space-4)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 11,
          }}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {/* Type toggle */}
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        {(["bug", "data_quality"] as ReportType[]).map((t) => (
          <button
            key={t}
            onClick={() => setReportType(t)}
            style={{
              flex: 1,
              padding: "var(--space-2)",
              background: reportType === t ? "var(--accent-primary)" : "var(--bg-elevated)",
              color: reportType === t ? "#fff" : "var(--text-muted)",
              border: "1px solid " + (reportType === t ? "var(--accent-primary)" : "var(--border-default)"),
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          >
            {t === "bug" ? "Bug Report" : "Data Quality"}
          </button>
        ))}
      </div>

      {reportType === "bug" ? (
        <>
          <div>
            <label style={labelStyle}>Page / Feature</label>
            <input type="text" value={page} onChange={(e) => setPage(e.target.value)} placeholder="e.g. /quadrants, Tool comparison" maxLength={500} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>What happened? *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue..." maxLength={2000} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={labelStyle}>Expected result</label>
            <textarea value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} placeholder="What should have happened?" maxLength={2000} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={labelStyle}>Screenshot (optional, max 5MB)</label>
            {screenshotUrl ? (
              <div style={{ fontSize: 11, color: "var(--score-high)" }}>✓ Screenshot uploaded</div>
            ) : (
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} disabled={uploading} style={{ fontSize: 11, color: "var(--text-secondary)" }} />
            )}
            {uploading && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Uploading...</span>}
          </div>
        </>
      ) : (
        <>
          <div>
            <label style={labelStyle}>Tool</label>
            <input type="text" value={toolSlug} onChange={(e) => setToolSlug(e.target.value)} placeholder="Tool name or slug" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>What's wrong? *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the incorrect data..." maxLength={2000} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={labelStyle}>Field</label>
            <input type="text" value={fieldReference} onChange={(e) => setFieldReference(e.target.value)} placeholder="e.g. pricing, category, license" maxLength={100} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Current value</label>
              <input type="text" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Correct value</label>
              <input type="text" value={correctedValue} onChange={(e) => setCorrectedValue(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Evidence link</label>
            <input type="url" value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} placeholder="https://..." style={inputStyle} />
          </div>
        </>
      )}

      {/* Email */}
      <div>
        <label style={labelStyle}>Email (optional)</label>
        <input type="email" value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} placeholder="you@example.com" maxLength={320} style={inputStyle} />
      </div>

      {error && (
        <div style={{ fontSize: 11, color: "#ef4444", padding: "var(--space-2)", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-sm)" }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !description.trim()}
        style={{
          padding: "var(--space-2) var(--space-4)",
          background: "var(--accent-primary)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting || !description.trim() ? 0.5 : 1,
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
        }}
      >
        {submitting ? "Submitting..." : "Submit report"}
      </button>
    </div>
  );
}

// ─── SHARED STYLES ──────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  color: "var(--text-muted)",
  marginBottom: 4,
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-2) var(--space-3)",
  background: "var(--bg-input)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: 12,
  fontFamily: "var(--font-mono)",
  outline: "none",
};
