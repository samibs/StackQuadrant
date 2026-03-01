import { pgTable, uuid, varchar, text, decimal, integer, timestamp, jsonb, unique, boolean, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("suggestions_status_idx").on(table.status),
  index("suggestions_tool_slug_idx").on(table.toolSlug),
  index("suggestions_type_idx").on(table.type),
  index("suggestions_created_at_idx").on(table.createdAt),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("reports_status_idx").on(table.status),
  index("reports_type_idx").on(table.type),
  index("reports_created_at_idx").on(table.createdAt),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("tool_changelog_tool_slug_idx").on(table.toolSlug),
  index("tool_changelog_created_at_idx").on(table.createdAt),
]);
