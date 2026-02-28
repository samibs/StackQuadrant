import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-in-production-32chars");

export async function signToken(payload: { userId: string; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as { userId: string; email: string; role: string };
}

export async function getAuthPayload(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  try {
    return await verifyToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

export async function requireAdmin(request: NextRequest) {
  const payload = await getAuthPayload(request);
  if (!payload || payload.role !== "admin") {
    return null;
  }
  return payload;
}
