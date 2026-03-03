// ============================================
// User Authentication — JWT Access + Refresh Tokens
// Extended from admin auth to support user auth with token rotation
// ============================================

import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { randomBytes, createHash } from "crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface UserTokenPayload {
  userId: string;
  email: string;
  role: "admin" | "member";
  type: "access" | "refresh";
}

/**
 * Sign a short-lived access token (15 min TTL).
 */
export async function signAccessToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

/**
 * Sign a long-lived refresh token (30 day TTL).
 * Returns both the raw token (for cookie) and the hash (for DB storage).
 */
export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(48).toString("base64url");
  const hash = hashToken(raw);
  return { raw, hash };
}

/**
 * SHA-256 hash a token for secure DB storage.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verify an access token from request cookies or Authorization header.
 */
export async function verifyAccessToken(request: NextRequest): Promise<UserTokenPayload | null> {
  const cookieToken = request.cookies.get("sq-access-token")?.value;
  const authHeader = request.headers.get("authorization");
  const token = cookieToken || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== "access") return null;
    return payload as unknown as UserTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Require authenticated user — returns payload or null.
 */
export async function requireUser(request: NextRequest): Promise<UserTokenPayload | null> {
  return verifyAccessToken(request);
}

/**
 * Refresh token cookie max age in seconds (30 days).
 */
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * Access token cookie max age in seconds (15 minutes).
 */
export const ACCESS_TOKEN_MAX_AGE = 15 * 60;

/**
 * Set auth cookies on a NextResponse.
 */
export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string
): void {
  const headers = new Headers(response.headers);

  const cookieOpts = "HttpOnly; Secure; SameSite=Strict; Path=/";
  const accessCookie = `sq-access-token=${accessToken}; Max-Age=${ACCESS_TOKEN_MAX_AGE}; ${cookieOpts}`;
  const refreshCookie = `sq-refresh-token=${refreshToken}; Max-Age=${REFRESH_TOKEN_MAX_AGE}; ${cookieOpts}`;

  headers.append("Set-Cookie", accessCookie);
  headers.append("Set-Cookie", refreshCookie);

  // Copy headers back — Response headers are immutable so we build manually
  // This is handled at the route level using NextResponse.cookies instead
}

/**
 * Password validation: min 8 chars, at least one uppercase, one lowercase, one digit.
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: "Password must contain at least one digit" };
  }
  return { valid: true };
}

/**
 * Email validation.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}
