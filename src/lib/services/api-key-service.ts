// ============================================
// API Key Service — Manage API keys for enterprise FinServ integrations
// Keys are scoped to teams, rate-limited, revocable, and audit-logged
// ============================================

import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";
import { apiKeys, apiKeyAuditLog, teams } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getTeamPlanLimits } from "@/lib/services/team-service";

const PLAN_API_LIMITS: Record<string, { allowed: boolean; dailyLimit: number }> = {
  analyst: { allowed: false, dailyLimit: 0 },
  team: { allowed: true, dailyLimit: 1000 },
  business: { allowed: true, dailyLimit: 10000 },
  enterprise: { allowed: true, dailyLimit: 100000 },
};

export function getApiLimits(planCode: string) {
  return PLAN_API_LIMITS[planCode] || PLAN_API_LIMITS.analyst;
}

export async function createApiKey(teamId: string, userId: string, name: string, scopes: string[] = ["read"]) {
  // Verify team plan allows API access
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) return { success: false as const, code: "NOT_FOUND", message: "Team not found" };

  const limits = getApiLimits(team.planCode);
  if (!limits.allowed) {
    return { success: false as const, code: "PLAN_LIMIT_REACHED", message: "API access requires Team plan or higher" };
  }

  // Generate a cryptographically secure API key
  const rawKey = `sq_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 11); // "sq_" + first 8 hex chars

  const [key] = await db
    .insert(apiKeys)
    .values({
      teamId,
      createdBy: userId,
      name,
      keyHash,
      keyPrefix,
      scopes,
      rateLimitPerDay: limits.dailyLimit,
    })
    .returning();

  // Audit log
  await db.insert(apiKeyAuditLog).values({
    apiKeyId: key.id,
    action: "created",
  });

  // Return the raw key only once — it's never stored
  return { success: true as const, key: { ...key, rawKey } };
}

export async function listApiKeys(teamId: string) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      rateLimitPerDay: apiKeys.rateLimitPerDay,
      requestsToday: apiKeys.requestsToday,
      lastUsedAt: apiKeys.lastUsedAt,
      revoked: apiKeys.revoked,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.teamId, teamId), eq(apiKeys.revoked, false)));
}

export async function revokeApiKey(keyId: string, teamId: string) {
  const [key] = await db
    .update(apiKeys)
    .set({ revoked: true, revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.teamId, teamId)))
    .returning();

  if (key) {
    await db.insert(apiKeyAuditLog).values({
      apiKeyId: key.id,
      action: "revoked",
    });
  }

  return key || null;
}

export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  teamId?: string;
  scopes?: string[];
  keyId?: string;
  rateLimited?: boolean;
}> {
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.revoked, false)));

  if (!key) return { valid: false };

  // Check expiry
  if (key.expiresAt && key.expiresAt < new Date()) {
    return { valid: false };
  }

  // Check rate limit
  if (key.requestsToday >= key.rateLimitPerDay) {
    await db.insert(apiKeyAuditLog).values({
      apiKeyId: key.id,
      action: "rate_limited",
    });
    return { valid: true, teamId: key.teamId, scopes: key.scopes as string[], keyId: key.id, rateLimited: true };
  }

  // Increment usage counter and update last used
  await db
    .update(apiKeys)
    .set({
      requestsToday: key.requestsToday + 1,
      lastUsedAt: new Date(),
    })
    .where(eq(apiKeys.id, key.id));

  // Audit
  await db.insert(apiKeyAuditLog).values({
    apiKeyId: key.id,
    action: "used",
  });

  return { valid: true, teamId: key.teamId, scopes: key.scopes as string[], keyId: key.id };
}
