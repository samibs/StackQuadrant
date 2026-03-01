# Changelog

All notable changes to StackQuadrant are documented here.

## [3.0.0] - 2026-03-01

### Added
- **Ask Widget** — Floating AI-powered assistant (bottom-right corner) that answers questions about tools, stacks, quadrants, and benchmarks using Claude with MCP tool-calling. Structured responses with recommendation cards, confidence scores, rationale bullets, alternatives, and a "Disagree?" flow into Suggest mode
- **Suggest a Correction** — Structured suggestion forms for: Add tool, Move tool, Update metadata, Merge duplicates, Flag discontinued. Includes tool name autocomplete, evidence links, tags, user role, and auto-captured context (page URL, browser, locale). Rate limited to 5/hr per IP
- **Report Issues** — Bug report form (page, description, expected result, screenshot upload) and Data quality report form (tool reference, field, current vs corrected value, evidence link). Rate limited: reports 10/hr, uploads 3/hr per IP
- **"Suggest a correction" link** — Every tool detail page now shows a "✎ Suggest a correction" button that opens the widget pre-filled with tool context
- **MCP Server** — Internal Model Context Protocol server exposing 12 tools (query_tools, get_tool_detail, compare_tools, query_quadrants, get_quadrant_detail, query_benchmarks, get_benchmark_detail, query_stacks, recommend_stack, search, query_repos, get_score_history) and 2 resources (dimensions, recent_changes) wrapping existing database queries
- **Admin Suggestions Queue** — Review dashboard for community suggestions with status filters (pending, approved, rejected, needs_info), type badges, pagination, and one-click approve/reject/request-info actions
- **Admin Suggestion Detail** — Evidence-first review page showing existing record diff preview, evidence links, similar past suggestions, and action modals
- **Admin Reports Page** — Filterable report queue with inline status changes, type badges (bug/data_quality), and pagination
- **Change Job Pipeline** — Approved suggestions create change jobs that record intended operations (insert, update, merge, flag) with payload. Jobs can be executed to create tool changelog entries. No direct production writes
- **Tool Changelog API** — Public `GET /api/v1/tools/:slug/changelog` endpoint returning the change history for any tool
- **Screenshot Upload** — Bug reports support screenshot attachments with magic-byte validation (PNG/JPEG/WebP only), 5MB limit, stored in `public/uploads/screenshots/`
- **Email Notifications** — Admin "Request Info" action sends emails to suggestion submitters via Nodemailer/Zoho SMTP asking for clarification

### Database
- New table: `suggestions` (19 columns — type, tool context, evidence, tags, user role, status workflow, community verification flag)
- New table: `reports` (19 columns — bug/data quality types, screenshot URL, field reference, status workflow)
- New table: `change_jobs` (11 columns — suggestion FK, operation payload, execution tracking, changelog link)
- New table: `tool_changelog` (9 columns — tool slug, change type, summary, evidence links, attribution)
- 16 new query functions in `queries.ts`

### API Endpoints (new)
- `POST /api/v1/widget/ask` — AI-powered query with MCP tool-use loop (rate: 20/hr)
- `POST /api/v1/widget/suggest` — Submit structured suggestion (rate: 5/hr)
- `POST /api/v1/widget/report` — Submit bug/data report (rate: 10/hr)
- `POST /api/v1/widget/report/upload` — Screenshot upload (rate: 3/hr)
- `GET /api/v1/admin/suggestions` — List suggestions with filters
- `GET /api/v1/admin/suggestions/:id` — Suggestion detail with similar matches
- `POST /api/v1/admin/suggestions/:id/approve` — Approve and create change job
- `POST /api/v1/admin/suggestions/:id/reject` — Reject with reason
- `POST /api/v1/admin/suggestions/:id/request-info` — Email submitter for clarification
- `GET /api/v1/admin/reports` — List reports with filters
- `GET/PUT /api/v1/admin/reports/:id` — Report detail and status update
- `GET /api/v1/admin/change-jobs` — List change jobs
- `POST /api/v1/admin/change-jobs/:id/execute` — Execute change job and create changelog
- `GET /api/v1/tools/:slug/changelog` — Public tool changelog

## [2.2.0] - 2026-03-01

### Added
- **Ultrawide monitor support**: New responsive breakpoints at 1440px, 1920px, 2560px (QHD), and 3440px (UWQHD) for optimal use of screen real estate on wide and ultrawide displays
- **Dashboard responsive grid**: Homepage dashboard expands from 3 columns to 4 (1920px+), 5 (2560px+), or 6 (3440px+) columns on wider screens
- **Blog multi-column layout**: Blog posts display in 2-column (1440px+), 3-column (2560px+), or 4-column (3440px+) grid on wide screens
- **Wide container scaling**: Blog, Compare, and Footer containers scale up from their base max-width to 1400px/1800px/2200px/3000px at progressive breakpoints
- **Card grid scaling**: Quadrants, Benchmarks, Stacks, and Showcase card grids use larger minimum card widths (380px/420px/480px) on wider screens
- **Empty state improvements**: Empty states on Quadrants, Benchmarks, Stacks, and Showcase pages now use minimum 30vh height (scaling to 40-50vh on ultrawide)

### Changed
- Homepage quadrant chart max height increased from 380px to 500px for better visibility
- Hero description text no longer constrained to 600px max-width
- Footer container now scales with wide-container breakpoints

## [2.1.0] - 2026-02-28

### Added
- **Repo Auto-Discovery**: Weekly GitHub Search API crawler finds and imports AI/LLM repos across 10 categories (`scripts/discover-repos.ts`)
- **Repo Auto-Scoring**: Metrics-based quality scoring engine derives scores from GitHub data with evidence text (`scripts/score-repos.ts`)
- **Repo Seeder**: Curated repo seeder with 17 AI/LLM repos including live GitHub metrics (`scripts/seed-repos.ts`)
- **Showcase GitHub Auto-Fill**: Paste a GitHub URL on the submit form to import project name, description, tech stack, and builder info
- **Optional Live URL**: Showcase submissions no longer require a live project URL — frameworks, CLIs, and libraries can be submitted
- **"Our Projects" Badge**: Floating right-side panel highlighting samibs repos with gold/amber accent color
- **Repos Page Redesign**: Full-viewport layout with category sidebar, dense card grid (240px min), owner-highlighted cards
- **Owner Filter**: Public repos API supports `?owner=` query parameter
- **`npm run db:score`**: New command for auto-scoring repos
- **PM2 Cron**: `repo-discovery` app runs weekly (Sunday 3am)
- **Color Tokens**: `--accent-owned`, `--accent-owned-dim`, `--bg-owned` for dark/light themes

### Changed
- Repos page increased from 24 to 48 items per page
- Showcase `project_url` column changed from NOT NULL to nullable

## [2.0.0] - 2026-02-28

### Added
- **AI/LLM Ecosystem Directory**: 6 new database tables, 10 categories, 6 quality dimensions
- **Vibe Coding Showcase**: Community submission form with email verification and admin moderation
- **GitHub Sync Worker**: PM2 cron job syncing GitHub metrics every 6 hours
- **Repos Pages**: Listing, detail (radar chart, metrics grid), category filter
- **Showcase Pages**: Gallery, detail, submit form, verify, built-with filter
- **Admin APIs**: Full CRUD for repos, repo categories, showcase moderation
- **Public APIs**: Repos, showcase, built-with, search index integration
- **Homepage Integration**: Featured repos, latest showcase projects
- **Command Palette**: Search repos and showcase projects
- **Navigation**: REPOS and SHOWCASE nav items

### Changed
- Updated README, help page, sitemap with all new sections
- Version bumped from 1.0.0 to 2.0.0

## [1.0.0] - 2026-02-28

### Added
- **Dashboard**: 3-column viewport-filling grid with tool rankings, quadrants, benchmarks
- **Capability Matrix**: Sortable, filterable table comparing 15 AI tools across 6 dimensions
- **Magic Quadrants**: Interactive SVG charts with Leaders/Visionaries/Challengers/Niche regions
- **Benchmarks**: Structured results for AI coding tasks
- **Stack Ratings**: Tool combination evaluations for workflows
- **Best For Pages**: Use-case based tool recommendations
- **Stack Builder**: Interactive wizard for custom tool stacks
- **Tool Comparison**: Side-by-side radar chart comparison
- **Score History**: Sparkline trend visualizations
- **Admin Dashboard**: Full CRUD with JWT authentication
- **Command Palette**: Cmd+K search across all entities
- **Dark/Light Theme**: Intelligence dashboard aesthetic
- **Responsive Design**: Mobile to ultrawide monitor support
- **SEO**: JSON-LD structured data, meta tags, sitemap, canonical URLs
- **Email**: Zoho SMTP integration for subscriptions
