"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface TrackedVendor {
  id: string;
  vendorName: string;
  vendorAliases: string[];
  sector: string;
  isActive: boolean;
  createdAt: string;
}

const SECTOR_LABELS: Record<string, string> = {
  fund: "Fund Industry", banking: "Banking", audit: "Audit", wealth: "Wealth Management",
  fiduciary: "Fiduciaries", accounting: "Accounting", "cross-sector": "Cross-Sector",
};

export default function VendorsPage() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [vendors, setVendors] = useState<TrackedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVendor, setNewVendor] = useState({ vendorName: "", sector: "fund", vendorAliases: "" });
  const [error, setError] = useState("");

  const loadVendors = async () => {
    try {
      const res = await authFetch("/api/v1/finserv/vendors");
      const data = await res.json();
      setVendors(data.data?.vendors || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadVendors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const handleAdd = async () => {
    setError("");
    if (!newVendor.vendorName.trim()) { setError("Vendor name is required"); return; }

    const res = await authFetch("/api/v1/finserv/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorName: newVendor.vendorName.trim(),
        sector: newVendor.sector,
        vendorAliases: newVendor.vendorAliases.split(",").map(a => a.trim()).filter(Boolean),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message || "Failed to add vendor");
      return;
    }

    setNewVendor({ vendorName: "", sector: "fund", vendorAliases: "" });
    setShowAddForm(false);
    await loadVendors();
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm("Remove this vendor from tracking?")) return;
    await authFetch(`/api/v1/finserv/vendors/${vendorId}`, { method: "DELETE" });
    await loadVendors();
  };

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Link href="/intelligence" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Intelligence</Link>
          <h1 style={{ fontSize: "20px", fontWeight: 700, marginTop: 4 }}>Vendor Pain Map</h1>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{
          padding: "6px 12px", background: "var(--accent)", color: "white",
          border: "none", borderRadius: 4, fontSize: "11px", fontWeight: 600, cursor: "pointer",
        }}>+ Track Vendor</button>
      </div>

      {/* Add Vendor Form */}
      {showAddForm && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
            <div>
              <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>VENDOR NAME</label>
              <input value={newVendor.vendorName} onChange={(e) => setNewVendor({ ...newVendor, vendorName: e.target.value })}
                placeholder="e.g., SimCorp" style={{
                  fontFamily: "var(--font-mono)", fontSize: "12px", padding: "6px 10px",
                  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit", width: 180,
                }} />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>SECTOR</label>
              <select value={newVendor.sector} onChange={(e) => setNewVendor({ ...newVendor, sector: e.target.value })} style={{
                fontFamily: "var(--font-mono)", fontSize: "12px", padding: "6px 10px",
                background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit",
              }}>
                {Object.entries(SECTOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>ALIASES (comma-separated)</label>
              <input value={newVendor.vendorAliases} onChange={(e) => setNewVendor({ ...newVendor, vendorAliases: e.target.value })}
                placeholder="e.g., SimCorp Dimension, SimCorp Coric" style={{
                  fontFamily: "var(--font-mono)", fontSize: "12px", padding: "6px 10px",
                  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit", width: 260,
                }} />
            </div>
            <button onClick={handleAdd} style={{
              padding: "6px 14px", background: "var(--accent)", color: "white",
              border: "none", borderRadius: 4, fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>Add</button>
          </div>
          {error && <div style={{ fontSize: "11px", color: "#ef4444", marginTop: 8 }}>{error}</div>}
        </div>
      )}

      {/* Vendor List */}
      {vendors.length === 0 ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, fontSize: "12px", color: "var(--text-muted)" }}>
          No vendors tracked yet. Add vendors to start monitoring pain signals.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {vendors.map((vendor) => (
            <div key={vendor.id} style={{
              display: "flex", alignItems: "center", gap: 12, background: "var(--bg-secondary)",
              border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px",
            }}>
              <Link href={`/intelligence/vendors/${vendor.id}`} style={{
                flex: 1, textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{vendor.vendorName}</span>
                <span style={{
                  fontSize: "10px", padding: "2px 6px", borderRadius: 3,
                  background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)",
                }}>{SECTOR_LABELS[vendor.sector] || vendor.sector}</span>
                {vendor.vendorAliases.length > 0 && (
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    ({vendor.vendorAliases.join(", ")})
                  </span>
                )}
              </Link>
              <button onClick={() => handleDelete(vendor.id)} style={{
                padding: "4px 8px", background: "none", border: "1px solid var(--border)",
                borderRadius: 3, fontSize: "10px", color: "var(--text-muted)", cursor: "pointer",
              }}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
