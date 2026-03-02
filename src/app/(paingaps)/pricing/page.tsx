"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

const plans = [
  {
    code: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["1 scan per month", "3 keywords per scan", "10 pain points max", "Reddit source", "Basic results"],
    cta: "Current Plan",
  },
  {
    code: "starter",
    name: "Starter",
    price: "$29",
    period: "/month",
    trial: "7-day free trial",
    features: ["5 scans per month", "10 keywords per scan", "50 pain points max", "All sources", "AI solution ideas", "Export results"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    code: "pro",
    name: "Pro",
    price: "$79",
    period: "/month",
    features: ["20 scans per month", "25 keywords per scan", "200 pain points max", "All sources", "AI solution ideas (5/point)", "Export with branding", "Opportunity Universe access"],
    cta: "Upgrade to Pro",
  },
];

export default function PricingPage() {
  const { user, authFetch } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(planCode: string) {
    if (!user) return;
    setLoading(planCode);

    try {
      const res = await authFetch("/api/v1/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ planCode }),
      });

      const data = await res.json();
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    } catch {
      // handled by authFetch
    } finally {
      setLoading(null);
    }
  }

  const currentPlan = user?.subscription?.planCode || "free";

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          PainGaps Pricing
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
          Discover market pain points. Build products people need.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
        {plans.map(plan => (
          <div
            key={plan.code}
            style={{
              padding: "24px",
              border: `1px solid ${plan.highlighted ? "var(--accent-primary)" : "var(--border-default)"}`,
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-surface)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {plan.name}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px", margin: "8px 0" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>{plan.price}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>{plan.period}</span>
            </div>
            {plan.trial && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-primary)", marginBottom: "8px" }}>
                {plan.trial}
              </div>
            )}
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", padding: "3px 0" }}>
                  + {f}
                </li>
              ))}
            </ul>

            {currentPlan === plan.code ? (
              <div style={{
                padding: "8px",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
              }}>
                Current Plan
              </div>
            ) : plan.code === "free" ? (
              <div />
            ) : (
              <button
                onClick={() => handleCheckout(plan.code)}
                disabled={loading === plan.code || !user}
                style={{
                  padding: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#fff",
                  background: plan.highlighted ? "var(--accent-primary)" : "var(--bg-elevated)",
                  border: plan.highlighted ? "none" : "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  cursor: loading === plan.code ? "not-allowed" : "pointer",
                  opacity: loading === plan.code ? 0.6 : 1,
                }}
              >
                {loading === plan.code ? "Redirecting..." : plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {!user && (
        <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "24px" }}>
          <Link href="/signup" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>Create an account</Link> to get started
        </p>
      )}
    </div>
  );
}
