import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";

/**
 * GET /api/v1/showcase/github-info?url=https://github.com/owner/repo
 * Fetches repo metadata from GitHub API for form auto-fill.
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) return apiError("VALIDATION_FAILED", "url parameter is required", 400);

    // Parse owner/repo from GitHub URL
    const match = url.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
    if (!match) return apiError("VALIDATION_FAILED", "Invalid GitHub URL. Expected: https://github.com/owner/repo", 400);

    const [, owner, repoName] = match;
    const cleanRepo = repoName.replace(/\.git$/, "");

    // Fetch repo info
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "StackQuadrant/1.0",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, { headers });
    if (!repoRes.ok) {
      if (repoRes.status === 404) return apiError("NOT_FOUND", "Repository not found", 404);
      return apiError("GITHUB_ERROR", `GitHub API returned ${repoRes.status}`, 502);
    }

    const repo = await repoRes.json();

    // Fetch languages for tech stack
    let languages: string[] = [];
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/languages`, { headers });
    if (langRes.ok) {
      const langData = await langRes.json();
      languages = Object.keys(langData).slice(0, 8);
    }

    // Fetch topics for additional context
    const topicHeaders = { ...headers, Accept: "application/vnd.github.mercy-preview+json" };
    let topics: string[] = repo.topics || [];
    if (!topics.length) {
      const topicRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/topics`, { headers: topicHeaders });
      if (topicRes.ok) {
        const topicData = await topicRes.json();
        topics = topicData.names || [];
      }
    }

    // Build tech stack from languages + relevant topics
    const techTopics = topics.filter((t: string) =>
      !["hacktoberfest", "good-first-issue", "help-wanted", "awesome"].includes(t)
    ).slice(0, 6);
    const techStack = [...new Set([...languages, ...techTopics])].slice(0, 10);

    return apiSuccess({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || "",
      homepage: repo.homepage || null,
      language: repo.language,
      languages,
      topics,
      techStack,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      license: repo.license?.spdx_id || null,
      ownerName: repo.owner?.login || owner,
      ownerAvatar: repo.owner?.avatar_url || null,
      ownerUrl: repo.owner?.html_url || null,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
    });
  } catch (error) {
    console.error("GET /api/v1/showcase/github-info error:", error);
    return apiError("INTERNAL_ERROR", "Failed to fetch GitHub info", 500);
  }
}
