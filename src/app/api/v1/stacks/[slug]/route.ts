import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getStackBySlug } from "@/lib/db/queries";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const stack = await getStackBySlug(slug);

    if (!stack) {
      return apiError("NOT_FOUND", "Stack not found", 404);
    }

    return apiSuccess(stack);
  } catch (error) {
    console.error("GET /api/v1/stacks/[slug] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
