"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

export default function AccountPage() {
  const { user, loading: authLoading, authFetch, logout } = useUser();
  const router = useRouter();
  const [subscription, setSubscription] = useState<{
    planCode: string; planName: string; status: string; priceMonthly: number;
    limits: { scansPerMonth: number; keywordsPerScan: number; painPointsPerScan: number; ideasPerPainPoint: number; exports: boolean };
    trialEndsAt: string | null; currentPeriodEnd: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    authFetch("/api/v1/billing/subscription")
      .then(res => res.json())
      .then(data => setSubscription(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, authFetch, router]);

  async function handleCancel() {
    setCanceling(true);
    try {
      await authFetch("/api/v1/billing/subscription", { method: "DELETE" });
      const res = await authFetch("/api/v1/billing/subscription");
      const data = await res.json();
      setSubscription(data.data);
    } catch {
      // handled
    } finally {
      setCanceling(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await authFetch("/api/v1/users/me", { method: "DELETE" });
      router.push("/");
    } catch {
      setDeleting(false);
    }
  }

  if (authLoading || loading) {
    return <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (!user) return null;

  const labelStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    fontWeight: 600 as const,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "4px",
  };

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 16px" }}>
      <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "24px" }}>
        Account
      </h1>

      {/* Profile section */}
      <section style={{ padding: "16px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", marginBottom: "16px" }}>
        <div style={labelStyle}>Profile</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-primary)", marginTop: "8px" }}>
          {user.fullName}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
          {user.email}
        </div>
      </section>

      {/* Subscription section */}
      <section style={{ padding: "16px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", marginBottom: "16px" }}>
        <div style={labelStyle}>Subscription</div>
        {subscription && (
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {subscription.planName}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
                  {subscription.status === "trialing" ? "Trial" : subscription.status}
                </span>
              </div>
              {subscription.priceMonthly > 0 && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)" }}>
                  ${subscription.priceMonthly}/mo
                </span>
              )}
            </div>

            {subscription.trialEndsAt && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)", marginTop: "4px" }}>
                Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}
              </div>
            )}

            {subscription.currentPeriodEnd && subscription.status !== "canceled" && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}

            {/* Limits */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
              <div style={{ padding: "6px 8px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase" }}>Scans/month</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{subscription.limits.scansPerMonth}</div>
              </div>
              <div style={{ padding: "6px 8px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase" }}>Keywords/scan</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{subscription.limits.keywordsPerScan}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {subscription.planCode !== "pro" && (
                <Link
                  href="/pricing"
                  style={{
                    padding: "6px 12px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "#fff",
                    background: "var(--accent-primary)",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                  }}
                >
                  Upgrade
                </Link>
              )}
              {subscription.planCode !== "free" && subscription.status !== "canceled" && (
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  style={{
                    padding: "6px 12px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    background: "none",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    cursor: canceling ? "not-allowed" : "pointer",
                  }}
                >
                  {canceling ? "Canceling..." : "Cancel Plan"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section style={{ padding: "16px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)" }}>
        <div style={{ ...labelStyle, color: "#ef4444" }}>Danger Zone</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)" }}>Delete Account</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>Permanently delete your account and all data</div>
          </div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#ef4444", background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
            >
              Delete
            </button>
          ) : (
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#fff", background: "#ef4444", border: "none", borderRadius: "var(--radius-sm)", cursor: deleting ? "not-allowed" : "pointer" }}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", background: "none", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <button
          onClick={logout}
          style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
