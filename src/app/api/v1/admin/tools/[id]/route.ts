import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateString, validateSlug, validateUrl, validateNumber, validateEnum, collectErrors } from "@/lib/utils/validate";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    if (!tool) return apiError("NOT_FOUND", "Tool not found", 404);
    return apiSuccess(tool);
  } catch (error) {
    console.error("GET /api/v1/admin/tools/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(tools).where(eq(tools.id, id));
    if (!existing) return apiError("NOT_FOUND", "Tool not found", 404);

    if (body.version !== undefined && body.version !== existing.version) {
      return apiError("CONFLICT", "Tool has been modified by another user", 409);
    }

    // Validate only provided fields (partial update)
    const errors = collectErrors(
      body.name !== undefined ? validateString(body.name, "name", { max: 200 }) : null,
      body.slug !== undefined ? validateSlug(body.slug) : null,
      body.description !== undefined ? validateString(body.description, "description", { max: 5000 }) : null,
      body.category !== undefined ? validateString(body.category, "category", { max: 100 }) : null,
      body.vendor !== undefined ? validateString(body.vendor, "vendor", { max: 200, required: false }) : null,
      body.websiteUrl !== undefined ? validateUrl(body.websiteUrl, "websiteUrl") : null,
      body.logoUrl !== undefined ? validateUrl(body.logoUrl, "logoUrl") : null,
      body.status !== undefined ? validateEnum(body.status, "status", ["draft", "published", "archived"]) : null,
      body.overallScore !== undefined ? validateNumber(body.overallScore, "overallScore", { min: 0, max: 10 }) : null,
    );

    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid input", 400, errors);
    }

    const [updated] = await db.update(tools).set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.websiteUrl !== undefined && { websiteUrl: body.websiteUrl }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.vendor !== undefined && { vendor: body.vendor }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.overallScore !== undefined && { overallScore: body.overallScore?.toString() }),
      updatedAt: new Date(),
      version: existing.version + 1,
    }).where(eq(tools.id, id)).returning();

    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/v1/admin/tools/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [deleted] = await db.delete(tools).where(eq(tools.id, id)).returning();
    if (!deleted) return apiError("NOT_FOUND", "Tool not found", 404);
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/admin/tools/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
