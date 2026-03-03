"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface SectorInfo {
  id: string;
  name: string;
  subCategories: string[];
}

interface RegulationSummary {
  id: string;
  name: string;
  shortCode: string;
  issuingBody: string;
  status: string;
  implementationDeadline: string | null;
  painScore: number | null;
}

export default function IntelligenceDashboard() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [sectors, setSectors] = useState<SectorInfo[]>([]);
  const [regulations, setRegulations] = useState<RegulationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasTeam, setHasTeam] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    const load = async () => {
      try {
        const [sectorsRes, regsRes] = await Promise.all([
          authFetch("/api/v1/finserv/sectors"),
          authFetch("/api/v1/finserv/regulations"),
        ]);

        if (sectorsRes.ok) {
          const sData = await sectorsRes.json();
          setSectors(sData.data?.sectors || []);
        } else if (sectorsRes.status === 403) {
          setHasTeam(false);
        }

        if (regsRes.ok) {
          const rData = await regsRes.json();
          setRegulations(rData.data?.regulations || []);
        }
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, authLoading, authFetch, router]);

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 16px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  if (!hasTeam) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: 16 }}>Financial Services Intelligence</h1>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24 }}>
          <p style={{ fontSize: "14px", marginBottom: 16 }}>You need a team membership to access FinServ intelligence.</p>
          <Link href="/intelligence/team" style={{
            display: "inline-block", padding: "8px 16px", background: "var(--accent)", color: "white",
            borderRadius: 4, textDecoration: "none", fontSize: "12px", fontWeight: 600,
          }}>Create a Team</Link>
        </div>
      </div>
    );
  }

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      proposed: "#6b7280", consultation: "#f59e0b", adopted: "#3b82f6", effective: "#10b981", superseded: "#9ca3af",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Financial Services Intelligence</h1>
        <Link href="/intelligence/team" style={{
          padding: "6px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: 4, textDecoration: "none", fontSize: "11px", color: "var(--text-secondary)",
        }}>Team Settings</Link>
      </div>

      {/* Sector Grid */}
      <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>SECTORS</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 32 }}>
        {sectors.map((sector) => (
          <Link key={sector.id} href={`/intelligence?sector=${sector.id}`} style={{
            display: "block", background: "var(--bg-secondary)", border: "1px solid var(--border)",
            borderRadius: 6, padding: 16, textDecoration: "none", color: "inherit",
          }}>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: 6 }}>{sector.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {sector.subCategories.slice(0, 3).join(" · ")}
              {sector.subCategories.length > 3 && ` +${sector.subCategories.length - 3}`}
            </div>
          </Link>
        ))}
      </div>

      {/* Regulatory Radar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>REGULATORY RADAR</h2>
        <Link href="/intelligence/regulations" style={{ fontSize: "11px", color: "var(--accent)", textDecoration: "none" }}>View All</Link>
      </div>
      {regulations.length === 0 ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 20, fontSize: "12px", color: "var(--text-muted)" }}>
          No regulations tracked yet. Regulatory data is ingested automatically from CSSF, FCA, ESMA, and other bodies.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          {regulations.slice(0, 8).map((reg) => (
            <Link key={reg.id} href={`/intelligence/regulations/${reg.id}`} style={{
              display: "flex", alignItems: "center", gap: 12, background: "var(--bg-secondary)",
              border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px",
              textDecoration: "none", color: "inherit",
            }}>
              <span style={{
                fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                background: statusColor(reg.status), color: "white", textTransform: "uppercase",
              }}>{reg.status}</span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", minWidth: 50 }}>{reg.shortCode}</span>
              <span style={{ fontSize: "12px", flex: 1 }}>{reg.name}</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{reg.issuingBody}</span>
              {reg.painScore !== null && (
                <span style={{
                  fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                  background: reg.painScore > 70 ? "#ef4444" : reg.painScore > 40 ? "#f59e0b" : "#10b981",
                  color: "white",
                }}>P:{reg.painScore}</span>
              )}
              {reg.implementationDeadline && (
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{reg.implementationDeadline}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/intelligence/vendors" style={{
          padding: "8px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: 4, textDecoration: "none", fontSize: "12px", color: "var(--text-secondary)",
        }}>Vendor Pain Map</Link>
        <Link href="/intelligence/regulations" style={{
          padding: "8px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: 4, textDecoration: "none", fontSize: "12px", color: "var(--text-secondary)",
        }}>Full Regulatory Radar</Link>
      </div>
    </div>
  );
}
