import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getPublishedRepos } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "20", 10), 50);
    const sort = url.searchParams.get("sort") || "-stars";
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";

    const result = await getPublishedRepos({ page, pageSize, sort, search, category });
    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/v1/repos error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
