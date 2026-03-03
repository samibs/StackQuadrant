// ============================================
// Team Service — Team management for FinServ enterprise vertical
// Handles team CRUD, member management, and access control
// ============================================

import { db } from "@/lib/db";
import { teams, teamMembers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Plan limits for team sizes
const PLAN_LIMITS: Record<string, { maxSeats: number; maxSectors: number; maxVendors: number }> = {
  analyst: { maxSeats: 1, maxSectors: 2, maxVendors: 5 },
  team: { maxSeats: 10, maxSectors: 999, maxVendors: 20 },
  business: { maxSeats: 25, maxSectors: 999, maxVendors: 50 },
  enterprise: { maxSeats: 999, maxSectors: 999, maxVendors: 999 },
};

export function getTeamPlanLimits(planCode: string) {
  return PLAN_LIMITS[planCode] || PLAN_LIMITS.analyst;
}

export async function createTeam(name: string, planCode: string, ownerId: string) {
  const [team] = await db.insert(teams).values({ name, planCode }).returning();

  // Add owner as team_admin
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: ownerId,
    role: "team_admin",
    sectorAccess: ["all"],
  });

  return team;
}

export async function getTeam(teamId: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  return team || null;
}

export async function getUserTeams(userId: string) {
  const memberships = await db
    .select({
      team: teams,
      membership: teamMembers,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId));

  return memberships.map((m) => ({
    ...m.team,
    role: m.membership.role,
    sectorAccess: m.membership.sectorAccess,
  }));
}

export async function updateTeam(teamId: string, updates: { name?: string; planCode?: string; settings?: Record<string, unknown> }) {
  const [updated] = await db
    .update(teams)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(teams.id, teamId))
    .returning();
  return updated || null;
}

export async function deleteTeam(teamId: string) {
  await db.delete(teams).where(eq(teams.id, teamId));
}

export async function getTeamMembers(teamId: string) {
  return db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      sectorAccess: teamMembers.sectorAccess,
      createdAt: teamMembers.createdAt,
      email: users.email,
      fullName: users.fullName,
    })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(eq(teamMembers.teamId, teamId));
}

export async function addTeamMember(teamId: string, userId: string, role: string, sectorAccess: string[] = ["all"]) {
  const team = await getTeam(teamId);
  if (!team) return { success: false as const, code: "NOT_FOUND", message: "Team not found" };

  const limits = getTeamPlanLimits(team.planCode);
  const existingMembers = await getTeamMembers(teamId);
  if (existingMembers.length >= limits.maxSeats) {
    return { success: false as const, code: "PLAN_LIMIT_REACHED", message: `Team plan allows max ${limits.maxSeats} seats` };
  }

  const [member] = await db
    .insert(teamMembers)
    .values({ teamId, userId, role, sectorAccess })
    .returning();

  return { success: true as const, member };
}

export async function removeTeamMember(teamId: string, userId: string) {
  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
}

export async function requireTeamAccess(userId: string, teamId: string): Promise<{ teamId: string; role: string; sectorAccess: string[] } | null> {
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));

  if (!membership) return null;
  return { teamId: membership.teamId, role: membership.role, sectorAccess: membership.sectorAccess as string[] };
}

export async function requireTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const access = await requireTeamAccess(userId, teamId);
  return access?.role === "team_admin";
}
