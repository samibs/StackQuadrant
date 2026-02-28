import { pgTable, uuid, varchar, text, decimal, integer, timestamp, jsonb, unique, boolean, check } from "drizzle-orm/pg-core";
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
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("version").notNull().default(1),
});

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
});

export const quadrantPositions = pgTable("quadrant_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quadrantId: uuid("quadrant_id").notNull().references(() => quadrants.id, { onDelete: "cascade" }),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  xPosition: decimal("x_position", { precision: 5, scale: 2 }).notNull(),
  yPosition: decimal("y_position", { precision: 5, scale: 2 }).notNull(),
}, (table) => [
  unique("quadrant_tool_unique").on(table.quadrantId, table.toolId),
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
});

export const benchmarkResults = pgTable("benchmark_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  benchmarkId: uuid("benchmark_id").notNull().references(() => benchmarks.id, { onDelete: "cascade" }),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  results: jsonb("results").notNull().$type<Record<string, number>>(),
  evidence: text("evidence"),
  runDate: timestamp("run_date", { withTimezone: true }).notNull(),
  runBy: varchar("run_by", { length: 200 }).notNull(),
  notes: text("notes"),
});

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
});

export const stackTools = pgTable("stack_tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  stackId: uuid("stack_id").notNull().references(() => stacks.id, { onDelete: "cascade" }),
  toolId: uuid("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 200 }).notNull(),
}, (table) => [
  unique("stack_tool_unique").on(table.stackId, table.toolId),
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
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 200 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
