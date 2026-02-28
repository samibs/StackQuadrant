"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "unknown";
  const message = searchParams.get("message") || "";

  const statusConfig: Record<string, { title: string; color: string; description: string }> = {
    success: {
      title: "Email Verified",
      color: "var(--status-success)",
      description: "Your submission has been verified and is now in the review queue. We'll email you when it's approved.",
    },
    already: {
      title: "Already Verified",
      color: "var(--accent-primary)",
      description: "This submission was already verified. It's in the review queue.",
    },
    error: {
      title: "Verification Failed",
      color: "var(--status-error)",
      description: message || "Something went wrong. The token may be invalid or expired.",
    },
    unknown: {
      title: "Verification",
      color: "var(--text-muted)",
      description: "No verification status found.",
    },
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      <div
        className="flex flex-col items-center justify-center py-[64px]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: config.color, marginBottom: "var(--space-3)" }}>
          {config.title}
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", maxWidth: "400px", lineHeight: 1.6 }}>
          {config.description}
        </p>
        <Link
          href="/showcase"
          style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-primary)", marginTop: "var(--space-4)" }}
        >
          ← Back to Showcase
        </Link>
      </div>
    </div>
  );
}

export default function ShowcaseVerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: "var(--grid-gap)", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
