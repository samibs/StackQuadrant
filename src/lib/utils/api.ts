import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

export function apiSuccess(data: unknown, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json({
    data,
    ...(meta ? { meta } : {}),
    correlationId: uuidv4(),
  }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Array<{ field: string; message: string }>
) {
  return NextResponse.json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    correlationId: uuidv4(),
  }, { status });
}

export function parsePageParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const sort = searchParams.get("sort") || "-overallScore";
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  return { page, pageSize, sort, search, category, offset: (page - 1) * pageSize };
}

export function getScoreColor(score: number): string {
  if (score >= 8) return "var(--score-high)";
  if (score >= 5) return "var(--score-mid)";
  return "var(--score-low)";
}

export function getScoreTier(score: number): "high" | "mid" | "low" {
  if (score >= 8) return "high";
  if (score >= 5) return "mid";
  return "low";
}
