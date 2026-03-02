import { pgTable, uuid, varchar, text, decimal, integer, timestamp, jsonb, unique, boolean, check, index, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { DomainConfig } from "@/lib/engine/types";

export const tools = pgTable("tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description").notNull(),
  websiteUrl: varchar("website_url", { length: 500 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  category: varchar("category", { length: 100 }).notNull(),
  vendor: varchar("vendor", { length: 200 }),
  pricingModel: varchar("pricing_model", { length: 50 }),
  pricingTier: varchar("pricing_tier", { length: 100 }),
  license: varchar("license", { length: 100 }),
  githubUrl: varchar("github_url", { length: 500 }),
  documentationUrl: varchar("documentation_url", { length: 500 }),
  githubStars: integer("github_stars"),
  communitySize: varchar("community_size", { length: 100 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  bestFor: jsonb("best_for").$type<string[]>().default([]),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("tools_status_updated_idx").on(table.status, table.updatedAt),
  index("tools_status_score_idx").on(table.status, table.overallScore),
  check("tools_score_range", sql`${table.overallScore} IS NULL OR (${table.overallScore} >= 0 AND ${table.overallScore} <= 10)`),
]);

export const dimensions = pgTable("dimensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  weight: decimal("weight", { precision: 3, scale: 2 }).notNull().default("1.00"),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const toolScores = pgTable("tool_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  dimensionId: uuid("dimension_id").notNull().references(() => dimensions.id, { onDelete: "cascade" }),
  score: decimal("score", { precision: 3, scale: 1 }).notNull(),
  evidence: text("evidence"),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull().defaultNow(),
  evaluatedBy: varchar("evaluated_by", { length: 200 }).notNull(),
}, (table) => [
  unique("tool_dimension_unique").on(table.toolId, table.dimensionId),
  check("tool_scores_score_range", sql`${table.score} >= 0 AND ${table.score} <= 10`),
]);

export const quadrants = pgTable("quadrants", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  description: text("description").notNull(),
  xAxisLabel: varchar("x_axis_label", { length: 100 }).notNull(),
  yAxisLabel: varchar("y_axis_label", { length: 100 }).notNull(),
  quadrantLabels: jsonb("quadrant_labels").notNull().$type<{
    topRight: string;
    topLeft: string;
    bottomRight: string;
    bottomLeft: string;
  }>(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("quadrants_status_published_idx").on(table.status, table.publishedAt),
]);

export const quadrantPositions = pgTable("quadrant_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quadrantId: uuid("quadrant_id").notNull().references(() => quadrants.id, { onDelete: "cascade" }),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  xPosition: decimal("x_position", { precision: 5, scale: 2 }).notNull(),
  yPosition: decimal("y_position", { precision: 5, scale: 2 }).notNull(),
}, (table) => [
  unique("quadrant_tool_unique").on(table.quadrantId, table.toolId),
  check("quadrant_x_range", sql`${table.xPosition} >= 0 AND ${table.xPosition} <= 100`),
  check("quadrant_y_range", sql`${table.yPosition} >= 0 AND ${table.yPosition} <= 100`),
]);

export const benchmarks = pgTable("benchmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  methodology: text("methodology").notNull(),
  metrics: jsonb("metrics").notNull().$type<Array<{
    name: string;
    unit: string;
    higherIsBetter: boolean;
  }>>(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("benchmarks_status_published_idx").on(table.status, table.publishedAt),
]);

export const benchmarkResults = pgTable("benchmark_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  benchmarkId: uuid("benchmark_id").notNull().references(() => benchmarks.id, { onDelete: "cascade" }),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  results: jsonb("results").notNull().$type<Record<string, number>>(),
  evidence: text("evidence"),
  runDate: timestamp("run_date", { withTimezone: true }).notNull(),
  runBy: varchar("run_by", { length: 200 }).notNull(),
  notes: text("notes"),
}, (table) => [
  unique("benchmark_tool_unique").on(table.benchmarkId, table.toolId),
  index("benchmark_results_benchmark_idx").on(table.benchmarkId),
  index("benchmark_results_tool_idx").on(table.toolId),
]);

export const stacks = pgTable("stacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  description: text("description").notNull(),
  useCase: varchar("use_case", { length: 200 }).notNull(),
  projectOutcome: text("project_outcome").notNull(),
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }).notNull(),
  metrics: jsonb("metrics").notNull().$type<Record<string, number>>(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("stacks_status_score_idx").on(table.status, table.overallScore),
  index("stacks_status_published_idx").on(table.status, table.publishedAt),
  check("stacks_score_range", sql`${table.overallScore} >= 0 AND ${table.overallScore} <= 10`),
]);

export const stackTools = pgTable("stack_tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  stackId: uuid("stack_id").notNull().references(() => stacks.id, { onDelete: "cascade" }),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 200 }).notNull(),
}, (table) => [
  unique("stack_tool_unique").on(table.stackId, table.toolId),
  index("stack_tools_stack_idx").on(table.stackId),
]);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  confirmationToken: varchar("confirmation_token", { length: 100 }).unique(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("blog_posts_status_published_idx").on(table.status, table.publishedAt),
]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 200 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scoreHistory = pgTable("score_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  dimensionId: uuid("dimension_id").notNull().references(() => dimensions.id, { onDelete: "cascade" }),
  oldScore: decimal("old_score", { precision: 3, scale: 1 }).notNull(),
  newScore: decimal("new_score", { precision: 3, scale: 1 }).notNull(),
  changeReason: text("change_reason"),
  changedBy: varchar("changed_by", { length: 200 }).notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("score_history_tool_idx").on(table.toolId),
  index("score_history_tool_dim_idx").on(table.toolId, table.dimensionId),
  index("score_history_changed_at_idx").on(table.changedAt),
]);

export const overallScoreHistory = pgTable("overall_score_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  oldScore: decimal("old_score", { precision: 3, scale: 1 }).notNull(),
  newScore: decimal("new_score", { precision: 3, scale: 1 }).notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("overall_score_history_tool_idx").on(table.toolId),
]);

// ============================================
// AI/LLM Ecosystem Directory
// ============================================

export const repoCategories = pgTable("repo_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description").notNull(),
  displayOrder: integer("display_order").notNull(),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("repo_categories_order_idx").on(table.displayOrder),
]);

export const repos = pgTable("repos", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 300 }).notNull().unique(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  description: text("description").notNull(),
  githubOwner: varchar("github_owner", { length: 200 }).notNull(),
  githubRepo: varchar("github_repo", { length: 200 }).notNull(),
  githubUrl: varchar("github_url", { length: 500 }).notNull(),
  websiteUrl: varchar("website_url", { length: 500 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  categoryId: uuid("category_id").notNull().references(() => repoCategories.id),
  license: varchar("license", { length: 100 }),
  language: varchar("language", { length: 100 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  // GitHub metrics (auto-synced)
  githubStars: integer("github_stars").default(0),
  githubForks: integer("github_forks").default(0),
  githubOpenIssues: integer("github_open_issues").default(0),
  githubWatchers: integer("github_watchers").default(0),
  githubContributors: integer("github_contributors").default(0),
  githubLastCommit: timestamp("github_last_commit", { withTimezone: true }),
  githubCreatedAt: timestamp("github_created_at", { withTimezone: true }),
  githubLastRelease: varchar("github_last_release", { length: 100 }),
  githubReleaseDate: timestamp("github_release_date", { withTimezone: true }),
  githubWeeklyCommits: integer("github_weekly_commits").default(0),
  githubSyncedAt: timestamp("github_synced_at", { withTimezone: true }),
  // Admin scores
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("repos_status_updated_idx").on(table.status, table.updatedAt),
  index("repos_status_score_idx").on(table.status, table.overallScore),
  index("repos_category_idx").on(table.categoryId),
  index("repos_github_stars_idx").on(table.githubStars),
  check("repos_score_range", sql`${table.overallScore} IS NULL OR (${table.overallScore} >= 0 AND ${table.overallScore} <= 10)`),
]);

export const repoDimensions = pgTable("repo_dimensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  weight: decimal("weight", { precision: 3, scale: 2 }).notNull().default("1.00"),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const repoScores = pgTable("repo_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  repoId: uuid("repo_id").notNull().references(() => repos.id, { onDelete: "cascade" }),
  dimensionId: uuid("dimension_id").notNull().references(() => repoDimensions.id, { onDelete: "cascade" }),
  score: decimal("score", { precision: 3, scale: 1 }).notNull(),
  evidence: text("evidence"),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull().defaultNow(),
  evaluatedBy: varchar("evaluated_by", { length: 200 }).notNull(),
}, (table) => [
  index("repo_scores_repo_idx").on(table.repoId),
  check("repo_scores_range", sql`${table.score} >= 0 AND ${table.score} <= 10`),
]);

// ============================================
// Vibe Coding Showcase
// ============================================

export const showcaseProjects = pgTable("showcase_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  description: text("description").notNull(),
  projectUrl: varchar("project_url", { length: 500 }),
  githubUrl: varchar("github_url", { length: 500 }),
  screenshotUrl: varchar("screenshot_url", { length: 500 }),
  techStack: jsonb("tech_stack").$type<string[]>().default([]),
  aiToolsUsed: jsonb("ai_tools_used").$type<string[]>().default([]),
  timeToBuild: varchar("time_to_build", { length: 100 }),
  builderName: varchar("builder_name", { length: 200 }).notNull(),
  builderEmail: varchar("builder_email", { length: 320 }).notNull(),
  builderUrl: varchar("builder_url", { length: 500 }),
  // Email verification
  verificationToken: varchar("verification_token", { length: 100 }).unique(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  // Admin moderation
  status: varchar("status", { length: 20 }).notNull().default("pending_verification"),
  adminNotes: text("admin_notes"),
  // Quality scoring
  qualityScore: decimal("quality_score", { precision: 3, scale: 1 }),
  qualityBreakdown: jsonb("quality_breakdown").$type<{ works: number; codeQuality: number; shipped: number }>(),
  // Timestamps
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: varchar("reviewed_by", { length: 200 }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("showcase_status_idx").on(table.status),
  index("showcase_status_published_idx").on(table.status, table.publishedAt),
  index("showcase_quality_idx").on(table.qualityScore),
  check("showcase_quality_range", sql`${table.qualityScore} IS NULL OR (${table.qualityScore} >= 0 AND ${table.qualityScore} <= 10)`),
]);

export const showcaseToolLinks = pgTable("showcase_tool_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => showcaseProjects.id, { onDelete: "cascade" }),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
}, (table) => [
  index("showcase_tool_links_tool_idx").on(table.toolId),
  index("showcase_tool_links_project_idx").on(table.projectId),
]);

// ============================================
// Community Widget: Ask + Suggest + Report
// ============================================

export const suggestions = pgTable("suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 30 }).notNull(), // add_tool, move_tool, update_metadata, merge_duplicates, flag_discontinued
  toolName: varchar("tool_name", { length: 200 }).notNull(),
  toolSlug: varchar("tool_slug", { length: 200 }),
  proposedQuadrant: varchar("proposed_quadrant", { length: 50 }),
  reason: text("reason").notNull(),
  evidenceLinks: jsonb("evidence_links").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  userRole: varchar("user_role", { length: 20 }).notNull().default("user"), // user, vendor, observer
  submitterEmail: varchar("submitter_email", { length: 320 }),
  context: jsonb("context").notNull().$type<{ pageUrl?: string; toolCardId?: string; browser?: string; locale?: string }>(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, needs_info
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: varchar("reviewed_by", { length: 200 }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  communityVerified: boolean("community_verified").notNull().default(false),
  supportCount: integer("support_count").notNull().default(0),
  supporterEmails: jsonb("supporter_emails").$type<string[]>().notNull().default([]),
  supporterEvidence: jsonb("supporter_evidence").$type<Array<{ email?: string; evidence?: string; addedAt: string }>>().notNull().default([]),
  ipHash: varchar("ip_hash", { length: 64 }),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  netScore: integer("net_score").notNull().default(0),
  site: varchar("site", { length: 50 }).notNull().default("stackquadrant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("suggestions_status_idx").on(table.status),
  index("suggestions_tool_slug_idx").on(table.toolSlug),
  index("suggestions_type_idx").on(table.type),
  index("suggestions_created_at_idx").on(table.createdAt),
  index("suggestions_community_verified_idx").on(table.communityVerified),
  index("suggestions_site_idx").on(table.site),
]);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 20 }).notNull(), // bug, data_quality
  toolSlug: varchar("tool_slug", { length: 200 }),
  page: varchar("page", { length: 500 }),
  description: text("description").notNull(),
  expectedResult: text("expected_result"),
  currentValue: text("current_value"),
  correctedValue: text("corrected_value"),
  fieldReference: varchar("field_reference", { length: 100 }),
  evidenceLink: varchar("evidence_link", { length: 500 }),
  screenshotUrl: varchar("screenshot_url", { length: 500 }),
  submitterEmail: varchar("submitter_email", { length: 320 }),
  context: jsonb("context").notNull().$type<{ pageUrl?: string; browser?: string; locale?: string }>(),
  status: varchar("status", { length: 20 }).notNull().default("new"), // new, investigating, fixed, closed, wont_fix
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by", { length: 200 }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  site: varchar("site", { length: 50 }).notNull().default("stackquadrant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("reports_status_idx").on(table.status),
  index("reports_type_idx").on(table.type),
  index("reports_created_at_idx").on(table.createdAt),
  index("reports_site_idx").on(table.site),
]);

export const changeJobs = pgTable("change_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  suggestionId: uuid("suggestion_id").notNull().references(() => suggestions.id, { onDelete: "cascade" }),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: uuid("record_id"),
  operation: varchar("operation", { length: 20 }).notNull(), // insert, update, delete
  payload: jsonb("payload").notNull().$type<Record<string, { old?: unknown; new: unknown }>>(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, executed, failed, rolled_back
  executedBy: varchar("executed_by", { length: 200 }),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  changelogEntryId: uuid("changelog_entry_id"),
  site: varchar("site", { length: 50 }).notNull().default("stackquadrant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("change_jobs_status_idx").on(table.status),
  index("change_jobs_suggestion_idx").on(table.suggestionId),
]);

export const toolChangelog = pgTable("tool_changelog", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolSlug: varchar("tool_slug", { length: 200 }).notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(), // quadrant_move, metadata_update, score_change, added, discontinued
  summary: text("summary").notNull(),
  details: jsonb("details").notNull().$type<{ field?: string; oldValue?: unknown; newValue?: unknown }>(),
  evidenceLinks: jsonb("evidence_links").$type<string[]>().default([]),
  suggestedBy: varchar("suggested_by", { length: 200 }),
  approvedBy: varchar("approved_by", { length: 200 }).notNull(),
  site: varchar("site", { length: 50 }).notNull().default("stackquadrant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("tool_changelog_tool_slug_idx").on(table.toolSlug),
  index("tool_changelog_created_at_idx").on(table.createdAt),
]);

// ============================================
// Phase 2: Intelligence Layer
// ============================================

export const askQueries = pgTable("ask_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  query: text("query").notNull(),
  normalizedQuery: text("normalized_query").notNull(),
  responseConfidence: varchar("response_confidence", { length: 10 }),
  toolsReferenced: jsonb("tools_referenced").$type<string[]>().notNull().default([]),
  ipHash: varchar("ip_hash", { length: 64 }),
  site: varchar("site", { length: 50 }).notNull().default("stackquadrant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("ask_queries_created_at_idx").on(table.createdAt),
  index("ask_queries_normalized_idx").on(table.normalizedQuery),
  index("ask_queries_site_idx").on(table.site),
]);

export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 100 }),
});

// ============================================
// Phase 3: Multi-App Gateway
// ============================================

// ============================================
// Phase 4: Premium & Polish
// ============================================

export const suggestionVotes = pgTable("suggestion_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  suggestionId: uuid("suggestion_id").notNull().references(() => suggestions.id, { onDelete: "cascade" }),
  vote: varchar("vote", { length: 4 }).notNull(), // 'up' or 'down'
  ipHash: varchar("ip_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("suggestion_vote_unique").on(table.suggestionId, table.ipHash),
  index("suggestion_votes_suggestion_idx").on(table.suggestionId),
  check("suggestion_votes_vote_check", sql`${table.vote} IN ('up', 'down')`),
]);

export const contributorStats = pgTable("contributor_stats", {
  emailHash: varchar("email_hash", { length: 64 }).primaryKey(),
  emailPreview: varchar("email_preview", { length: 20 }),
  totalSubmissions: integer("total_submissions").notNull().default(0),
  approvedCount: integer("approved_count").notNull().default(0),
  rejectedCount: integer("rejected_count").notNull().default(0),
  reputationScore: integer("reputation_score").notNull().default(0),
  firstSubmission: timestamp("first_submission", { withTimezone: true }),
  lastSubmission: timestamp("last_submission", { withTimezone: true }),
  autoApproveEligible: boolean("auto_approve_eligible").notNull().default(false),
});

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  suggestionId: uuid("suggestion_id").references(() => suggestions.id, { onDelete: "set null" }),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // 'approved', 'rejected', 'needs_info', 'auto_approved'
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  emailSubject: text("email_subject"),
}, (table) => [
  index("notification_log_suggestion_idx").on(table.suggestionId),
  index("notification_log_sent_at_idx").on(table.sentAt),
]);

export const registeredSites = pgTable("registered_sites", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g., 'stackquadrant', 'frontaliercalc'
  name: varchar("name", { length: 100 }).notNull(),
  origin: varchar("origin", { length: 255 }).notNull(),
  mcpConfig: jsonb("mcp_config").notNull().$type<{
    systemPrompt?: string;
    tools?: string[];
    resources?: string[];
  }>(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// Core Quadrant Engine — Multi-Domain Platform
// ============================================

export const domains = pgTable("domains", {
  id: varchar("id", { length: 60 }).primaryKey(),              // e.g., "developer-tools"
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),    // URL prefix
  description: text("description").notNull(),
  config: jsonb("config").notNull().$type<DomainConfig>(),     // Full domain configuration
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scoringDimensions = pgTable("scoring_dimensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  domainId: varchar("domain_id", { length: 60 }).notNull().references(() => domains.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  weight: decimal("weight", { precision: 3, scale: 2 }).notNull(),
  scaleMin: integer("scale_min").notNull().default(0),
  scaleMax: integer("scale_max").notNull().default(10),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("scoring_dimensions_domain_idx").on(table.domainId),
  check("scoring_dimensions_weight_range", sql`${table.weight} >= 0 AND ${table.weight} <= 1`),
]);

export const scoredEntities = pgTable("scored_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  domainId: varchar("domain_id", { length: 60 }).notNull().references(() => domains.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 60 }).notNull(),    // e.g., "tool", "pain_point", "vendor"
  name: varchar("name", { length: 240 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull(),
  compositeScore: decimal("composite_score", { precision: 5, scale: 2 }),
  quadrantX: decimal("quadrant_x", { precision: 5, scale: 2 }),
  quadrantY: decimal("quadrant_y", { precision: 5, scale: 2 }),
  metadata: jsonb("metadata").notNull().$type<Record<string, unknown>>().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_entities_domain_type").on(table.domainId, table.entityType),
  index("idx_entities_composite_score").on(table.compositeScore),
  index("idx_entities_domain_slug").on(table.domainId, table.slug),
  unique("scored_entities_domain_slug_unique").on(table.domainId, table.slug),
]);

export const dimensionScores = pgTable("dimension_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").notNull().references(() => scoredEntities.id, { onDelete: "cascade" }),
  dimensionId: uuid("dimension_id").notNull().references(() => scoringDimensions.id, { onDelete: "cascade" }),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  scoredAt: timestamp("scored_at", { withTimezone: true }).notNull().defaultNow(),
  source: varchar("source", { length: 60 }).notNull(),            // "manual", "computed", "adapter"
}, (table) => [
  index("idx_dim_scores_entity").on(table.entityId),
  unique("dim_scores_entity_dimension_unique").on(table.entityId, table.dimensionId),
]);

export const engineScoreHistory = pgTable("engine_score_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").notNull().references(() => scoredEntities.id, { onDelete: "cascade" }),
  compositeScore: decimal("composite_score", { precision: 5, scale: 2 }).notNull(),
  dimensionScores: jsonb("dimension_scores").notNull().$type<Record<string, number>>(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_history_entity_date").on(table.entityId, table.recordedAt),
]);

export const rawSignals = pgTable("raw_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  domainId: varchar("domain_id", { length: 60 }).notNull().references(() => domains.id, { onDelete: "cascade" }),
  sourceType: varchar("source_type", { length: 60 }).notNull(),    // "reddit", "github", "appstore", etc.
  sourceUrl: text("source_url").notNull(),
  content: text("content").notNull(),
  author: varchar("author", { length: 240 }),
  signalTimestamp: timestamp("signal_timestamp", { withTimezone: true }).notNull(),
  metadata: jsonb("metadata").notNull().$type<Record<string, unknown>>().default({}),
  processed: boolean("processed").notNull().default(false),
  ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_signals_domain_unprocessed").on(table.domainId, table.processed),
  index("idx_signals_source_type").on(table.sourceType),
  index("idx_signals_ingested_at").on(table.ingestedAt),
]);

export const sourceAdapterRuns = pgTable("source_adapter_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adapterId: varchar("adapter_id", { length: 60 }).notNull(),
  domainId: varchar("domain_id", { length: 60 }).notNull().references(() => domains.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull(),             // "queued", "running", "completed", "failed"
  signalsFetched: integer("signals_fetched").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_adapter_runs_adapter_domain").on(table.adapterId, table.domainId),
  index("idx_adapter_runs_status").on(table.status),
  index("idx_adapter_runs_created_at").on(table.createdAt),
]);

// ============================================
// PainGaps Retail — User Auth & Billing
// ============================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),   // "admin", "member"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("users_email_idx").on(table.email),
]);

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").notNull().default(false),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("refresh_tokens_user_idx").on(table.userId),
  index("refresh_tokens_hash_idx").on(table.tokenHash),
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  planCode: varchar("plan_code", { length: 30 }).notNull(),           // "free", "starter", "pro"
  status: varchar("status", { length: 30 }).notNull(),                // "trialing", "active", "past_due", "canceled"
  stripeCustomerId: varchar("stripe_customer_id", { length: 60 }).unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 60 }).unique(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  version: integer("version").notNull().default(1),                    // Optimistic locking
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("subscriptions_user_idx").on(table.userId),
  index("subscriptions_status_idx").on(table.status),
  check("subscriptions_plan_check", sql`${table.planCode} IN ('free', 'starter', 'pro')`),
]);

// ============================================
// PainGaps Retail — Scans & Pain Points
// ============================================

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetKeywords: jsonb("target_keywords").notNull().$type<string[]>(),
  targetSubreddits: jsonb("target_subreddits").$type<string[]>(),
  targetAppCategories: jsonb("target_app_categories").$type<string[]>(),
  enabledSources: jsonb("enabled_sources").notNull().$type<string[]>(),
  timeframeDays: integer("timeframe_days").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("queued"),  // "queued", "running", "completed", "failed"
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorCode: varchar("error_code", { length: 60 }),
  idempotencyKey: varchar("idempotency_key", { length: 64 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("scans_user_idx").on(table.userId),
  index("scans_status_idx").on(table.status),
  index("scans_created_at_idx").on(table.createdAt),
  check("scans_timeframe_check", sql`${table.timeframeDays} IN (7, 30, 90)`),
]);

export const painPoints = pgTable("pain_points", {
  id: uuid("id").primaryKey().defaultRandom(),
  scanId: uuid("scan_id").notNull().references(() => scans.id, { onDelete: "cascade" }),
  scoredEntityId: uuid("scored_entity_id").references(() => scoredEntities.id).unique(),
  title: varchar("title", { length: 240 }).notNull(),
  summary: text("summary").notNull(),
  severityScore: integer("severity_score").notNull(),
  frequencyScore: integer("frequency_score").notNull(),
  intensityScore: integer("intensity_score").notNull(),
  marketSizeScore: integer("market_size_score").notNull(),
  competitionScore: integer("competition_score").notNull(),
  wtpScore: integer("wtp_score").notNull(),                           // Willingness to pay
  trendDirection: varchar("trend_direction", { length: 20 }).notNull(), // "growing", "stable", "declining"
  sourceCount: integer("source_count").notNull().default(1),
  audienceSummary: text("audience_summary"),
  competitorNames: jsonb("competitor_names").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("pain_points_scan_idx").on(table.scanId),
  index("pain_points_severity_idx").on(table.severityScore),
  check("pain_points_severity_range", sql`${table.severityScore} >= 0 AND ${table.severityScore} <= 100`),
  check("pain_points_frequency_range", sql`${table.frequencyScore} >= 0 AND ${table.frequencyScore} <= 100`),
  check("pain_points_intensity_range", sql`${table.intensityScore} >= 0 AND ${table.intensityScore} <= 100`),
]);

export const evidenceItems = pgTable("evidence_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  painPointId: uuid("pain_point_id").notNull().references(() => painPoints.id, { onDelete: "cascade" }),
  sourceType: varchar("source_type", { length: 60 }).notNull(),       // "reddit", "appstore", "twitter", etc.
  quoteText: text("quote_text").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceName: varchar("source_name", { length: 120 }).notNull(),
  author: varchar("author", { length: 240 }),
  originalTimestamp: timestamp("original_timestamp", { withTimezone: true }).notNull(),
}, (table) => [
  index("evidence_items_pain_point_idx").on(table.painPointId),
  index("evidence_items_source_type_idx").on(table.sourceType),
]);

export const solutionIdeas = pgTable("solution_ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  painPointId: uuid("pain_point_id").notNull().references(() => painPoints.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description").notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  targetAudience: text("target_audience"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("solution_ideas_pain_point_idx").on(table.painPointId),
  check("solution_ideas_confidence_range", sql`${table.confidenceScore} >= 0 AND ${table.confidenceScore} <= 100`),
]);

// ============================================
// PainGaps Financial Services — Enterprise Vertical
// ============================================

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  planCode: varchar("plan_code", { length: 30 }).notNull(),                // "analyst", "team", "business", "enterprise"
  stripeCustomerId: varchar("stripe_customer_id", { length: 60 }).unique(),
  settings: jsonb("settings").notNull().$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("teams_plan_code_idx").on(table.planCode),
  check("teams_plan_check", sql`${table.planCode} IN ('analyst', 'team', 'business', 'enterprise')`),
]);

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),                         // "team_admin", "team_member"
  sectorAccess: jsonb("sector_access").notNull().$type<string[]>().default(["all"]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("team_members_team_user_unique").on(table.teamId, table.userId),
  index("team_members_team_idx").on(table.teamId),
  index("team_members_user_idx").on(table.userId),
  check("team_members_role_check", sql`${table.role} IN ('team_admin', 'team_member')`),
]);

export const trackedVendors = pgTable("tracked_vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  vendorName: varchar("vendor_name", { length: 240 }).notNull(),
  vendorAliases: jsonb("vendor_aliases").notNull().$type<string[]>().default([]),
  sector: varchar("sector", { length: 60 }).notNull(),                     // fund, banking, audit, wealth, fiduciary, accounting
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("tracked_vendors_team_idx").on(table.teamId),
  index("tracked_vendors_sector_idx").on(table.sector),
  check("tracked_vendors_sector_check", sql`${table.sector} IN ('fund', 'banking', 'audit', 'wealth', 'fiduciary', 'accounting', 'cross-sector')`),
]);

export const regulations = pgTable("regulations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 240 }).notNull(),
  shortCode: varchar("short_code", { length: 30 }).notNull().unique(),
  issuingBody: varchar("issuing_body", { length: 120 }).notNull(),         // CSSF, FCA, ESMA, etc.
  jurisdictions: jsonb("jurisdictions").notNull().$type<string[]>(),
  effectiveDate: date("effective_date"),
  implementationDeadline: date("implementation_deadline"),
  status: varchar("status", { length: 30 }).notNull(),                     // proposed, consultation, adopted, effective, superseded
  summary: text("summary").notNull(),
  sourceUrl: text("source_url").notNull(),
  impactMap: jsonb("impact_map").$type<Record<string, number>>(),          // Department impact scores
  painScore: integer("pain_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("regulations_issuing_body_idx").on(table.issuingBody),
  index("regulations_status_idx").on(table.status),
  index("regulations_effective_date_idx").on(table.effectiveDate),
  check("regulations_pain_range", sql`${table.painScore} IS NULL OR (${table.painScore} >= 0 AND ${table.painScore} <= 100)`),
  check("regulations_status_check", sql`${table.status} IN ('proposed', 'consultation', 'adopted', 'effective', 'superseded')`),
]);

export const vendorPains = pgTable("vendor_pains", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackedVendorId: uuid("tracked_vendor_id").notNull().references(() => trackedVendors.id, { onDelete: "cascade" }),
  scoredEntityId: uuid("scored_entity_id").references(() => scoredEntities.id),
  title: varchar("title", { length: 240 }).notNull(),
  summary: text("summary").notNull(),
  intensityScore: integer("intensity_score").notNull(),
  frequencyScore: integer("frequency_score").notNull(),
  trendDirection: varchar("trend_direction", { length: 20 }).notNull(),    // growing, stable, declining
  fixDetected: boolean("fix_detected").notNull().default(false),
  fixDetectedAt: timestamp("fix_detected_at", { withTimezone: true }),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
  evidenceCount: integer("evidence_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("vendor_pains_vendor_idx").on(table.trackedVendorId),
  index("vendor_pains_intensity_idx").on(table.intensityScore),
  check("vendor_pains_intensity_range", sql`${table.intensityScore} >= 0 AND ${table.intensityScore} <= 100`),
  check("vendor_pains_frequency_range", sql`${table.frequencyScore} >= 0 AND ${table.frequencyScore} <= 100`),
  check("vendor_pains_trend_check", sql`${table.trendDirection} IN ('growing', 'stable', 'declining')`),
]);

export const alertConfigs = pgTable("alert_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type", { length: 60 }).notNull(),             // regulation_spike, vendor_pain, sector_trend, talent_alert
  topicFilter: jsonb("topic_filter").notNull().$type<Record<string, unknown>>(),
  threshold: integer("threshold").notNull(),
  channel: varchar("channel", { length: 20 }).notNull(),                  // email, dashboard, both
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("alert_configs_team_idx").on(table.teamId),
  index("alert_configs_user_idx").on(table.userId),
  check("alert_configs_channel_check", sql`${table.channel} IN ('email', 'dashboard', 'both')`),
]);

// ============================================
// FinServ Phase 3 — API Keys & Enterprise Features
// ============================================

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  keyHash: varchar("key_hash", { length: 128 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 12 }).notNull(),             // First 8 chars for display
  scopes: jsonb("scopes").notNull().$type<string[]>().default(["read"]),  // read, write, admin
  rateLimitPerDay: integer("rate_limit_per_day").notNull().default(1000),
  requestsToday: integer("requests_today").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revoked: boolean("revoked").notNull().default(false),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("api_keys_team_idx").on(table.teamId),
  index("api_keys_hash_idx").on(table.keyHash),
]);

export const apiKeyAuditLog = pgTable("api_key_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiKeyId: uuid("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 30 }).notNull(),                    // created, used, revoked, rate_limited
  ipAddress: varchar("ip_address", { length: 45 }),
  endpoint: varchar("endpoint", { length: 200 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("api_key_audit_log_key_idx").on(table.apiKeyId),
  index("api_key_audit_log_created_at_idx").on(table.createdAt),
]);
