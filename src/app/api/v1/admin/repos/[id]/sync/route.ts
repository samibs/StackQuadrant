import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { repos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchAllMetrics } from "@/lib/services/github";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [repo] = await db.select().from(repos).where(eq(repos.id, id));
    if (!repo) return apiError("NOT_FOUND", "Repo not found", 404);

    const metrics = await fetchAllMetrics(repo.githubOwner, repo.githubRepo);
    if (!metrics) {
      return apiError("EXTERNAL_ERROR", `Failed to fetch GitHub metrics for ${repo.githubOwner}/${repo.githubRepo}`, 502);
    }

    const [updated] = await db.update(repos).set({
      githubStars: metrics.stars,
      githubForks: metrics.forks,
      githubOpenIssues: metrics.openIssues,
      githubWatchers: metrics.watchers,
      githubContributors: metrics.contributors,
      githubLastCommit: metrics.lastCommit,
      githubCreatedAt: metrics.createdAt,
      githubLastRelease: metrics.lastRelease,
      githubReleaseDate: metrics.releaseDate,
      githubWeeklyCommits: metrics.weeklyCommits,
      githubSyncedAt: new Date(),
      language: metrics.language || repo.language,
      license: metrics.license || repo.license,
      updatedAt: new Date(),
    }).where(eq(repos.id, id)).returning();

    return apiSuccess({ synced: true, repo: updated });
  } catch (error) {
    console.error("POST /api/v1/admin/repos/[id]/sync error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
