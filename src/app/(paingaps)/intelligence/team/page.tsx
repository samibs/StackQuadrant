"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

interface Team {
  id: string;
  name: string;
  planCode: string;
  role: string;
  sectorAccess: string[];
  createdAt: string;
}

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
  sectorAccess: string[];
  createdAt: string;
}

export default function TeamPage() {
  const { user, loading: authLoading, authFetch } = useUser();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", planCode: "analyst" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("team_member");
  const [error, setError] = useState("");

  const loadTeams = useCallback(async () => {
    try {
      const res = await authFetch("/api/v1/finserv/teams");
      const data = await res.json();
      setTeams(data.data?.teams || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const loadMembers = useCallback(async (teamId: string) => {
    try {
      const res = await authFetch(`/api/v1/finserv/teams/${teamId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.data?.members || []);
      }
    } catch {
      // handled
    }
  }, [authFetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadTeams();
  }, [user, authLoading, router, loadTeams]);

  useEffect(() => {
    if (teams.length > 0 && teams[0].role === "team_admin") {
      loadMembers(teams[0].id);
    }
  }, [teams, loadMembers]);

  const handleCreateTeam = async () => {
    setError("");
    if (!newTeam.name.trim()) { setError("Team name is required"); return; }

    const res = await authFetch("/api/v1/finserv/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTeam),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message || "Failed to create team");
      return;
    }

    setNewTeam({ name: "", planCode: "analyst" });
    setShowCreateForm(false);
    await loadTeams();
  };

  const handleInvite = async () => {
    setError("");
    if (!inviteEmail.trim()) { setError("Email is required"); return; }
    if (teams.length === 0) return;

    const res = await authFetch(`/api/v1/finserv/teams/${teams[0].id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message || "Failed to invite member");
      return;
    }

    setInviteEmail("");
    setShowInviteForm(false);
    await loadMembers(teams[0].id);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this member from the team?")) return;
    if (teams.length === 0) return;

    await authFetch(`/api/v1/finserv/teams/${teams[0].id}/members?userId=${userId}`, { method: "DELETE" });
    await loadMembers(teams[0].id);
  };

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  const PLAN_LABELS: Record<string, string> = { analyst: "Analyst ($499/mo)", team: "Team ($2,000/mo)", business: "Business ($5,000/mo)", enterprise: "Enterprise (Custom)" };

  return (
    <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <Link href="/intelligence" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none" }}>← Intelligence</Link>
      <h1 style={{ fontSize: "20px", fontWeight: 700, marginTop: 8, marginBottom: 20 }}>Team Management</h1>

      {teams.length === 0 ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: "13px", marginBottom: 16 }}>No team yet. Create a team to access FinServ intelligence.</p>
          {!showCreateForm ? (
            <button onClick={() => setShowCreateForm(true)} style={{
              padding: "8px 16px", background: "var(--accent)", color: "white",
              border: "none", borderRadius: 4, fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}>Create Team</button>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
              <div>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>TEAM NAME</label>
                <input value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="My Organization" style={{
                    fontFamily: "var(--font-mono)", fontSize: "12px", padding: "6px 10px",
                    background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit", width: 200,
                  }} />
              </div>
              <div>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>PLAN</label>
                <select value={newTeam.planCode} onChange={(e) => setNewTeam({ ...newTeam, planCode: e.target.value })} style={{
                  fontFamily: "var(--font-mono)", fontSize: "12px", padding: "6px 10px",
                  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit",
                }}>
                  {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <button onClick={handleCreateTeam} style={{
                padding: "6px 14px", background: "var(--accent)", color: "white",
                border: "none", borderRadius: 4, fontSize: "11px", fontWeight: 600, cursor: "pointer",
              }}>Create</button>
            </div>
          )}
          {error && <div style={{ fontSize: "11px", color: "#ef4444", marginTop: 8 }}>{error}</div>}
        </div>
      ) : (
        <>
          {/* Team Info */}
          {teams.map((team) => (
            <div key={team.id} style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 16, marginBottom: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>{team.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 4 }}>
                    Plan: {PLAN_LABELS[team.planCode] || team.planCode} · Role: {team.role}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Members */}
          {teams[0]?.role === "team_admin" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>TEAM MEMBERS</h2>
                <button onClick={() => setShowInviteForm(!showInviteForm)} style={{
                  padding: "4px 10px", background: "var(--accent)", color: "white",
                  border: "none", borderRadius: 4, fontSize: "10px", fontWeight: 600, cursor: "pointer",
                }}>+ Invite</button>
              </div>

              {showInviteForm && (
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                    <div>
                      <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>EMAIL</label>
                      <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="user@company.com" style={{
                          fontFamily: "var(--font-mono)", fontSize: "12px", padding: "6px 10px",
                          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit", width: 220,
                        }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>ROLE</label>
                      <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{
                        fontFamily: "var(--font-mono)", fontSize: "12px", padding: "6px 10px",
                        background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit",
                      }}>
                        <option value="team_member">Member</option>
                        <option value="team_admin">Admin</option>
                      </select>
                    </div>
                    <button onClick={handleInvite} style={{
                      padding: "6px 12px", background: "var(--accent)", color: "white",
                      border: "none", borderRadius: 4, fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    }}>Add</button>
                  </div>
                  {error && <div style={{ fontSize: "11px", color: "#ef4444", marginTop: 8 }}>{error}</div>}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {members.map((member) => (
                  <div key={member.id} style={{
                    display: "flex", alignItems: "center", gap: 10, background: "var(--bg-secondary)",
                    border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px",
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, flex: 1 }}>{member.fullName}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{member.email}</span>
                    <span style={{
                      fontSize: "10px", padding: "2px 6px", borderRadius: 3,
                      background: member.role === "team_admin" ? "var(--accent)" : "var(--bg)",
                      color: member.role === "team_admin" ? "white" : "var(--text-muted)",
                      border: member.role !== "team_admin" ? "1px solid var(--border)" : "none",
                    }}>{member.role === "team_admin" ? "Admin" : "Member"}</span>
                    {member.userId !== user?.id && (
                      <button onClick={() => handleRemoveMember(member.userId)} style={{
                        padding: "2px 6px", background: "none", border: "1px solid var(--border)",
                        borderRadius: 3, fontSize: "10px", color: "var(--text-muted)", cursor: "pointer",
                      }}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
