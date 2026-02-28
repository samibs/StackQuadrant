const GITHUB_API = "https://api.github.com";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "StackQuadrant/1.0",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

let rateLimitRemaining = 5000;
let rateLimitReset = 0;

async function githubFetch(path: string): Promise<Response> {
  // Pause if near rate limit
  if (rateLimitRemaining < 10) {
    const waitMs = Math.max(0, (rateLimitReset * 1000) - Date.now() + 1000);
    if (waitMs > 0 && waitMs < 3600000) {
      console.warn(`[github] Rate limit near (${rateLimitRemaining} remaining), waiting ${Math.round(waitMs / 1000)}s`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  const res = await fetch(`${GITHUB_API}${path}`, { headers: getHeaders() });

  // Track rate limits
  const remaining = res.headers.get("x-ratelimit-remaining");
  const reset = res.headers.get("x-ratelimit-reset");
  if (remaining) rateLimitRemaining = parseInt(remaining, 10);
  if (reset) rateLimitReset = parseInt(reset, 10);

  if (rateLimitRemaining < 100) {
    console.warn(`[github] Rate limit warning: ${rateLimitRemaining} remaining`);
  }

  return res;
}

export interface GitHubRepoData {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  language: string | null;
  license: string | null;
  pushedAt: string | null;
  createdAt: string | null;
}

export async function fetchRepoMetrics(owner: string, repo: string): Promise<GitHubRepoData | null> {
  const res = await githubFetch(`/repos/${owner}/${repo}`);
  if (!res.ok) {
    console.error(`[github] Failed to fetch ${owner}/${repo}: ${res.status} ${res.statusText}`);
    return null;
  }
  const data = await res.json();
  return {
    stars: data.stargazers_count || 0,
    forks: data.forks_count || 0,
    openIssues: data.open_issues_count || 0,
    watchers: data.subscribers_count || 0,
    language: data.language || null,
    license: data.license?.spdx_id || null,
    pushedAt: data.pushed_at || null,
    createdAt: data.created_at || null,
  };
}

export async function fetchContributorCount(owner: string, repo: string): Promise<number> {
  // Use per_page=1 and parse the Link header for total count
  const res = await githubFetch(`/repos/${owner}/${repo}/contributors?per_page=1&anon=true`);
  if (!res.ok) return 0;

  const link = res.headers.get("link");
  if (!link) {
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  }

  // Parse Link: <...?page=547>; rel="last"
  const match = link.match(/page=(\d+)>;\s*rel="last"/);
  return match ? parseInt(match[1], 10) : 1;
}

export interface ReleaseData {
  tag: string;
  publishedAt: string | null;
}

export async function fetchLatestRelease(owner: string, repo: string): Promise<ReleaseData | null> {
  const res = await githubFetch(`/repos/${owner}/${repo}/releases/latest`);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    tag: data.tag_name || null,
    publishedAt: data.published_at || null,
  };
}

export async function fetchWeeklyCommits(owner: string, repo: string): Promise<number> {
  const res = await githubFetch(`/repos/${owner}/${repo}/stats/commit_activity`);
  if (!res.ok) return 0;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return 0;
  // Last entry is the most recent week
  return data[data.length - 1]?.total || 0;
}

export interface FullRepoMetrics {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  contributors: number;
  language: string | null;
  license: string | null;
  lastCommit: Date | null;
  createdAt: Date | null;
  lastRelease: string | null;
  releaseDate: Date | null;
  weeklyCommits: number;
}

export async function fetchAllMetrics(owner: string, repo: string): Promise<FullRepoMetrics | null> {
  const basic = await fetchRepoMetrics(owner, repo);
  if (!basic) return null;

  const [contributors, release, weeklyCommits] = await Promise.all([
    fetchContributorCount(owner, repo),
    fetchLatestRelease(owner, repo),
    fetchWeeklyCommits(owner, repo),
  ]);

  return {
    stars: basic.stars,
    forks: basic.forks,
    openIssues: basic.openIssues,
    watchers: basic.watchers,
    contributors,
    language: basic.language,
    license: basic.license,
    lastCommit: basic.pushedAt ? new Date(basic.pushedAt) : null,
    createdAt: basic.createdAt ? new Date(basic.createdAt) : null,
    lastRelease: release?.tag || null,
    releaseDate: release?.publishedAt ? new Date(release.publishedAt) : null,
    weeklyCommits,
  };
}

export function getRateLimitStatus() {
  return { remaining: rateLimitRemaining, resetAt: new Date(rateLimitReset * 1000) };
}
