"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface VendorPain {
  id: string;
  title: string;
  summary: string;
  intensityScore: number;
  frequencyScore: number;
  trendDirection: string;
  fixDetected: boolean;
  fixDetectedAt: string | null;
  firstSeenAt: string;
  evidenceCount: number;
}

interface VendorDetail {
  id: string;
  vendorName: string;
  vendorAliases: string[];
  sector: string;
  isActive: boolean;
  pains: VendorPain[];
}

export default function VendorDetailPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState("");

  useEffect(() => {
    params.then((p) => setVendorId(p.vendorId));
  }, [params]);

  useEffect(() => {
    if (authLoading || !vendorId) return;
    if (!user) { router.push("/login"); return; }

    authFetch(`/api/v1/finserv/vendors/${vendorId}`)
      .then(res => res.json())
      .then(data => setVendor(data.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, authFetch, router, vendorId]);

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <Link href="/intelligence/vendors" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Back</Link>
        <p style={{ fontSize: "14px", marginTop: 16 }}>Vendor not found.</p>
      </div>
    );
  }

  const trendIcon = (dir: string) => {
    if (dir === "growing") return "↑";
    if (dir === "declining") return "↓";
    return "→";
  };

  const trendColor = (dir: string) => {
    if (dir === "growing") return "#ef4444";
    if (dir === "declining") return "#10b981";
    return "#6b7280";
  };

  return (
    <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <Link href="/intelligence/vendors" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Vendor Pain Map</Link>

      <div style={{ marginTop: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: 4 }}>{vendor.vendorName}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{vendor.sector}</span>
          {vendor.vendorAliases.length > 0 && (
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Also: {vendor.vendorAliases.join(", ")}</span>
          )}
        </div>
      </div>

      {/* Pain Rankings */}
      <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>
        PAIN RANKINGS ({vendor.pains.length})
      </h2>

      {vendor.pains.length === 0 ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)" }}>
          No pain signals detected yet. Signals are collected from Reddit, review sites, and industry sources.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {vendor.pains.map((pain, idx) => (
            <div key={pain.id} style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", minWidth: 24 }}>#{idx + 1}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>{pain.title}</span>
                {pain.fixDetected && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                    background: "#10b981", color: "white",
                  }}>FIX DETECTED</span>
                )}
                <span style={{ fontSize: "11px", fontWeight: 700, color: trendColor(pain.trendDirection) }}>
                  {trendIcon(pain.trendDirection)} {pain.trendDirection}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: 8 }}>{pain.summary}</div>
              <div style={{ display: "flex", gap: 16, fontSize: "10px", color: "var(--text-muted)" }}>
                <span>Intensity: <strong style={{ color: pain.intensityScore > 70 ? "#ef4444" : "inherit" }}>{pain.intensityScore}</strong></span>
                <span>Frequency: <strong>{pain.frequencyScore}</strong></span>
                <span>Evidence: {pain.evidenceCount} signals</span>
                <span>First seen: {new Date(pain.firstSeenAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
