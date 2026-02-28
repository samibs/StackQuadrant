-- Migration: Add AI/LLM Ecosystem Directory + Vibe Coding Showcase tables
-- Run: psql $DATABASE_URL -f migrations/002-ecosystem-showcase.sql

BEGIN;

-- ============================================
-- SECTION 1: AI/LLM Ecosystem Directory
-- ============================================

CREATE TABLE IF NOT EXISTS repo_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL UNIQUE,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS repo_categories_order_idx ON repo_categories(display_order);

CREATE TABLE IF NOT EXISTS repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL UNIQUE,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  github_owner VARCHAR(200) NOT NULL,
  github_repo VARCHAR(200) NOT NULL,
  github_url VARCHAR(500) NOT NULL,
  website_url VARCHAR(500),
  logo_url VARCHAR(500),
  category_id UUID NOT NULL REFERENCES repo_categories(id),
  license VARCHAR(100),
  language VARCHAR(100),
  tags JSONB DEFAULT '[]',
  -- GitHub metrics (auto-synced)
  github_stars INTEGER DEFAULT 0,
  github_forks INTEGER DEFAULT 0,
  github_open_issues INTEGER DEFAULT 0,
  github_watchers INTEGER DEFAULT 0,
  github_contributors INTEGER DEFAULT 0,
  github_last_commit TIMESTAMPTZ,
  github_created_at TIMESTAMPTZ,
  github_last_release VARCHAR(100),
  github_release_date TIMESTAMPTZ,
  github_weekly_commits INTEGER DEFAULT 0,
  github_synced_at TIMESTAMPTZ,
  -- Admin scores
  overall_score DECIMAL(3,1),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE(github_owner, github_repo),
  CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 10))
);
CREATE INDEX IF NOT EXISTS repos_status_updated_idx ON repos(status, updated_at);
CREATE INDEX IF NOT EXISTS repos_status_score_idx ON repos(status, overall_score);
CREATE INDEX IF NOT EXISTS repos_category_idx ON repos(category_id);
CREATE INDEX IF NOT EXISTS repos_github_stars_idx ON repos(github_stars);

CREATE TABLE IF NOT EXISTS repo_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repo_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  dimension_id UUID NOT NULL REFERENCES repo_dimensions(id) ON DELETE CASCADE,
  score DECIMAL(3,1) NOT NULL,
  evidence TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evaluated_by VARCHAR(200) NOT NULL,
  UNIQUE(repo_id, dimension_id),
  CHECK (score >= 0 AND score <= 10)
);
CREATE INDEX IF NOT EXISTS repo_scores_repo_idx ON repo_scores(repo_id);

-- ============================================
-- SECTION 2: Vibe Coding Showcase
-- ============================================

CREATE TABLE IF NOT EXISTS showcase_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  project_url VARCHAR(500) NOT NULL,
  github_url VARCHAR(500),
  screenshot_url VARCHAR(500),
  tech_stack JSONB DEFAULT '[]',
  ai_tools_used JSONB DEFAULT '[]',
  time_to_build VARCHAR(100),
  builder_name VARCHAR(200) NOT NULL,
  builder_email VARCHAR(320) NOT NULL,
  builder_url VARCHAR(500),
  -- Email verification
  verification_token VARCHAR(100) UNIQUE,
  verified_at TIMESTAMPTZ,
  -- Admin moderation
  status VARCHAR(20) NOT NULL DEFAULT 'pending_verification',
  admin_notes TEXT,
  -- Admin quality scoring
  quality_score DECIMAL(3,1),
  quality_breakdown JSONB,
  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(200),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 10))
);
CREATE INDEX IF NOT EXISTS showcase_status_idx ON showcase_projects(status);
CREATE INDEX IF NOT EXISTS showcase_status_published_idx ON showcase_projects(status, published_at);
CREATE INDEX IF NOT EXISTS showcase_quality_idx ON showcase_projects(quality_score);

CREATE TABLE IF NOT EXISTS showcase_tool_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES showcase_projects(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  UNIQUE(project_id, tool_id)
);
CREATE INDEX IF NOT EXISTS showcase_tool_links_tool_idx ON showcase_tool_links(tool_id);
CREATE INDEX IF NOT EXISTS showcase_tool_links_project_idx ON showcase_tool_links(project_id);

-- ============================================
-- SEED DATA
-- ============================================

-- Repo Categories
INSERT INTO repo_categories (name, slug, description, display_order, icon) VALUES
  ('LLM Frameworks', 'llm-frameworks', 'Libraries and frameworks for building applications with large language models', 1, NULL),
  ('Agent Frameworks', 'agent-frameworks', 'Tools for building autonomous AI agents and multi-agent systems', 2, NULL),
  ('Fine-tuning Tools', 'fine-tuning', 'Tools for fine-tuning, training, and adapting foundation models', 3, NULL),
  ('RAG Libraries', 'rag-libraries', 'Retrieval-Augmented Generation frameworks and pipelines', 4, NULL),
  ('Vector Databases', 'vector-databases', 'Databases optimized for storing and querying vector embeddings', 5, NULL),
  ('Inference Engines', 'inference-engines', 'High-performance model inference and serving runtimes', 6, NULL),
  ('Prompt Engineering', 'prompt-engineering', 'Tools for crafting, testing, and managing prompts', 7, NULL),
  ('AI DevOps', 'ai-devops', 'MLOps, deployment, monitoring, and lifecycle management tools', 8, NULL),
  ('Model Serving', 'model-serving', 'Platforms for deploying and serving ML/AI models at scale', 9, NULL),
  ('Evaluation & Testing', 'evaluation-testing', 'Frameworks for evaluating, benchmarking, and testing AI systems', 10, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Repo Dimensions
INSERT INTO repo_dimensions (name, slug, description, weight, display_order) VALUES
  ('Documentation Quality', 'documentation-quality', 'Completeness, clarity, and maintenance of docs, tutorials, and API references', 0.20, 1),
  ('Community Health', 'community-health', 'Issue response time, contributor diversity, discussion activity, and governance', 0.20, 2),
  ('Maintenance Velocity', 'maintenance-velocity', 'Commit frequency, release cadence, dependency updates, and bug fix speed', 0.15, 3),
  ('API Design & DX', 'api-design-dx', 'API ergonomics, consistency, type safety, error messages, and developer experience', 0.20, 4),
  ('Production Readiness', 'production-readiness', 'Error handling, logging, security, performance, and stability under load', 0.15, 5),
  ('Ecosystem Integration', 'ecosystem-integration', 'Compatibility with other tools, plugins, extensions, and standard formats', 0.10, 6)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
