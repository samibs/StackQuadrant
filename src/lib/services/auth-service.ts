// ============================================
// Auth Service — Business logic for user signup, login, logout, refresh
// ============================================

import { db } from "@/lib/db";
import { users, refreshTokens, subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  validatePassword,
  validateEmail,
  REFRESH_TOKEN_MAX_AGE,
} from "@/lib/auth/user-auth";

const BCRYPT_COST = 12;

interface AuthResult {
  success: true;
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  refreshTokenRaw: string;
}

interface AuthError {
  success: false;
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Create a new user account with free subscription.
 */
export async function signup(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult | AuthError> {
  const { email, password, fullName } = input;

  // Validate email
  if (!validateEmail(email)) {
    return { success: false, code: "VALIDATION_FAILED", message: "Invalid email address", details: [{ field: "email", message: "Invalid email address" }] };
  }

  // Validate password
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    return { success: false, code: "VALIDATION_FAILED", message: pwCheck.message!, details: [{ field: "password", message: pwCheck.message! }] };
  }

  // Validate full name
  if (!fullName || fullName.trim().length < 2) {
    return { success: false, code: "VALIDATION_FAILED", message: "Full name is required (min 2 characters)", details: [{ field: "fullName", message: "Full name is required (min 2 characters)" }] };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail));
  if (existing) {
    return { success: false, code: "CONFLICT", message: "An account with this email already exists" };
  }

  // Hash password
  const passwordHash = await hash(password, BCRYPT_COST);

  // Create user + free subscription in a transaction
  const [newUser] = await db.insert(users).values({
    email: normalizedEmail,
    passwordHash,
    fullName: fullName.trim(),
    role: "member",
  }).returning({ id: users.id, email: users.email, role: users.role });

  // Create free subscription
  await db.insert(subscriptions).values({
    userId: newUser.id,
    planCode: "free",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // effectively never expires
  });

  // Generate tokens
  const accessToken = await signAccessToken({ userId: newUser.id, email: newUser.email, role: newUser.role });
  const refreshTokenData = generateRefreshToken();

  // Store refresh token hash
  await db.insert(refreshTokens).values({
    userId: newUser.id,
    tokenHash: refreshTokenData.hash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000),
  });

  return {
    success: true,
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    accessToken,
    refreshTokenRaw: refreshTokenData.raw,
  };
}

/**
 * Authenticate a user with email and password.
 */
export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult | AuthError> {
  const { email, password } = input;

  if (!email || !password) {
    return { success: false, code: "VALIDATION_FAILED", message: "Email and password are required" };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (!user) {
    return { success: false, code: "UNAUTHORIZED", message: "Invalid email or password" };
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, code: "UNAUTHORIZED", message: "Invalid email or password" };
  }

  // Update last login
  await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, user.id));

  // Generate tokens
  const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshTokenData = generateRefreshToken();

  // Store refresh token hash
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: refreshTokenData.hash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000),
  });

  return {
    success: true,
    userId: user.id,
    email: user.email,
    role: user.role,
    accessToken,
    refreshTokenRaw: refreshTokenData.raw,
  };
}

/**
 * Rotate a refresh token. Returns new access + refresh tokens.
 * Implements reuse detection: if a revoked token is reused, all user tokens are invalidated.
 */
export async function refreshSession(rawRefreshToken: string): Promise<AuthResult | AuthError> {
  const tokenHash = hashToken(rawRefreshToken);

  // Look up the refresh token
  const [storedToken] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash));

  if (!storedToken) {
    return { success: false, code: "UNAUTHORIZED", message: "Invalid refresh token" };
  }

  // Reuse detection: if token was already revoked, invalidate ALL user tokens
  if (storedToken.revoked) {
    await db
      .update(refreshTokens)
      .set({ revoked: true, revokedAt: new Date() })
      .where(eq(refreshTokens.userId, storedToken.userId));

    return { success: false, code: "UNAUTHORIZED", message: "Token reuse detected — all sessions invalidated" };
  }

  // Check expiration
  if (new Date() > storedToken.expiresAt) {
    await db
      .update(refreshTokens)
      .set({ revoked: true, revokedAt: new Date() })
      .where(eq(refreshTokens.id, storedToken.id));

    return { success: false, code: "UNAUTHORIZED", message: "Refresh token expired" };
  }

  // Revoke the old token
  await db
    .update(refreshTokens)
    .set({ revoked: true, revokedAt: new Date() })
    .where(eq(refreshTokens.id, storedToken.id));

  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, storedToken.userId));
  if (!user) {
    return { success: false, code: "UNAUTHORIZED", message: "User not found" };
  }

  // Issue new tokens
  const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role });
  const newRefreshToken = generateRefreshToken();

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: newRefreshToken.hash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000),
  });

  return {
    success: true,
    userId: user.id,
    email: user.email,
    role: user.role,
    accessToken,
    refreshTokenRaw: newRefreshToken.raw,
  };
}

/**
 * Logout — revoke all refresh tokens for a user.
 */
export async function logout(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revoked: true, revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.revoked, false)));
}

/**
 * Get user profile by ID.
 */
export async function getUserProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return null;

  // Get subscription
  const [sub] = await db
    .select({
      planCode: subscriptions.planCode,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  return {
    ...user,
    subscription: sub || { planCode: "free", status: "active", currentPeriodEnd: null },
  };
}

/**
 * Delete user account and all associated data (cascades via FK).
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
  return result.length > 0;
}
