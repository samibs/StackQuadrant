import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getBenchmarkBySlug } from "@/lib/db/queries";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const benchmark = await getBenchmarkBySlug(slug);

    if (!benchmark) {
      return apiError("NOT_FOUND", "Benchmark not found", 404);
    }

    return apiSuccess(benchmark);
  } catch (error) {
    console.error("GET /api/v1/benchmarks/[slug] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
