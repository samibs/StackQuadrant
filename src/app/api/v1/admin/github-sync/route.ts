import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { repos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchAllMetrics, getRateLimitStatus } from "@/lib/services/github";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const allRepos = await db.select({
      id: repos.id,
      githubOwner: repos.githubOwner,
      githubRepo: repos.githubRepo,
      name: repos.name,
    }).from(repos);

    const results: Array<{ id: string; name: string; status: "synced" | "failed"; error?: string }> = [];

    for (const repo of allRepos) {
      try {
        const rateLimit = getRateLimitStatus();
        if (rateLimit.remaining < 20) {
          results.push({ id: repo.id, name: repo.name, status: "failed", error: "Rate limit too low, stopping bulk sync" });
          break;
        }

        const metrics = await fetchAllMetrics(repo.githubOwner, repo.githubRepo);
        if (!metrics) {
          results.push({ id: repo.id, name: repo.name, status: "failed", error: "GitHub API returned no data" });
          continue;
        }

        await db.update(repos).set({
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
          language: metrics.language,
          updatedAt: new Date(),
        }).where(eq(repos.id, repo.id));

        results.push({ id: repo.id, name: repo.name, status: "synced" });

        // 500ms delay between repos to be respectful of rate limits
        await new Promise((r) => setTimeout(r, 500));
      } catch (repoError) {
        results.push({
          id: repo.id,
          name: repo.name,
          status: "failed",
          error: repoError instanceof Error ? repoError.message : "Unknown error",
        });
      }
    }

    const synced = results.filter((r) => r.status === "synced").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const rateLimit = getRateLimitStatus();

    return apiSuccess({
      total: allRepos.length,
      synced,
      failed,
      rateLimit: { remaining: rateLimit.remaining, resetsAt: rateLimit.resetAt.toISOString() },
      results,
    });
  } catch (error) {
    console.error("POST /api/v1/admin/github-sync error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
