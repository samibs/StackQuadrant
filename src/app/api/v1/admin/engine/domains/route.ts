import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth";
import { registerDomain, getDomain, setDomainActive, listDomains } from "@/lib/engine";
import type { DomainConfig } from "@/lib/engine/types";

/**
 * GET /api/v1/admin/engine/domains
 * List all domains (including inactive) for admin management.
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const domains = await listDomains();
    return NextResponse.json({ success: true, data: domains });
  } catch (error) {
    console.error("Failed to list domains:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to list domains" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/engine/domains
 * Register or update a domain configuration.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as DomainConfig;

    if (!body.id || !body.name || !body.slug || !body.description) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_FAILED", message: "Missing required fields: id, name, slug, description" },
        { status: 400 }
      );
    }

    // Validate scoring dimension weights sum to ~1
    if (body.scoringDimensions && body.scoringDimensions.length > 0) {
      const weightSum = body.scoringDimensions.reduce((sum, d) => sum + d.weight, 0);
      if (Math.abs(weightSum - 1.0) > 0.05) {
        return NextResponse.json(
          { success: false, error: "VALIDATION_FAILED", message: `Dimension weights must sum to 1.0 (got ${weightSum.toFixed(2)})` },
          { status: 400 }
        );
      }
    }

    await registerDomain(body);

    const domain = await getDomain(body.id);
    return NextResponse.json({ success: true, data: domain }, { status: 201 });
  } catch (error) {
    console.error("Failed to register domain:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to register domain" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/admin/engine/domains
 * Activate/deactivate a domain.
 * Body: { domainId: string, isActive: boolean }
 */
export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as { domainId: string; isActive: boolean };

    if (!body.domainId || typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { success: false, error: "VALIDATION_FAILED", message: "Missing required fields: domainId, isActive" },
        { status: 400 }
      );
    }

    const domain = await getDomain(body.domainId);
    if (!domain) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Domain not found" },
        { status: 404 }
      );
    }

    await setDomainActive(body.domainId, body.isActive);
    return NextResponse.json({ success: true, message: `Domain ${body.isActive ? "activated" : "deactivated"}` });
  } catch (error) {
    console.error("Failed to update domain:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to update domain" },
      { status: 500 }
    );
  }
}
