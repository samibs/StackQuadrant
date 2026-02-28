import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";

const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/v1/auth/login": { limit: 5, windowMs: 15 * 60 * 1000 },    // 5 attempts per 15 min
  "/api/v1/subscribers": { limit: 3, windowMs: 60 * 60 * 1000 },    // 3 per hour
  "/api/v1/showcase/submit": { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
};

const ADMIN_API_LIMIT = { limit: 30, windowMs: 60 * 1000 }; // 30 req/min for admin endpoints
const API_GLOBAL_LIMIT = { limit: 60, windowMs: 60 * 1000 }; // 60 req/min for all API

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit API routes
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);

    // Check specific route limits first
    for (const [route, config] of Object.entries(RATE_LIMITS)) {
      if (pathname === route && request.method === "POST") {
        const result = rateLimit(`${route}:${ip}`, config.limit, config.windowMs);
        if (!result.success) {
          return NextResponse.json(
            { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
            {
              status: 429,
              headers: {
                "Retry-After": Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
                "X-RateLimit-Limit": config.limit.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
              },
            }
          );
        }
      }
    }

    // Admin API rate limit
    if (pathname.startsWith("/api/v1/admin/")) {
      const adminResult = rateLimit(`admin:${ip}`, ADMIN_API_LIMIT.limit, ADMIN_API_LIMIT.windowMs);
      if (!adminResult.success) {
        return NextResponse.json(
          { error: { code: "RATE_LIMITED", message: "Too many admin requests. Please slow down." } },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil((adminResult.resetAt - Date.now()) / 1000).toString(),
              "X-RateLimit-Limit": ADMIN_API_LIMIT.limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": Math.ceil(adminResult.resetAt / 1000).toString(),
            },
          }
        );
      }
    }

    // Global API rate limit
    const globalResult = rateLimit(`api:${ip}`, API_GLOBAL_LIMIT.limit, API_GLOBAL_LIMIT.windowMs);
    if (!globalResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests." } },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((globalResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // Protect admin pages (server-side) — check for auth cookie
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/api/")) {
    const token = request.cookies.get("sq-admin-token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
