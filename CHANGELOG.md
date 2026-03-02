# Changelog

All notable changes to StackQuadrant are documented here.

## [4.0.0] - 2026-03-02

### Added — PainGaps Retail Intelligence
- **Pain Point Scans** — Run AI-powered scans on any product/tool to detect user pain points from Reddit, review sites, Google Autocomplete, and Twitter. Scans produce structured pain signals with severity, frequency, trend direction, and evidence counts
- **AI Pain Analysis** — OpenAI-powered analysis of collected pain signals: generates titles, summaries, intensity/frequency/opportunity scores, affected user segments, root causes, and competitive gaps
- **Billing & Plans** — Free/Starter/Pro tiered billing via Stripe integration with checkout, portal, and webhook handling. Plan limits enforce scan counts, pain point views, and feature access
- **User Authentication** — JWT-based dual auth system: 15-minute access tokens + 30-day rotating refresh tokens, signup with plan selection, login, logout, and session refresh
- **Pain Universe Search** — Pro-only cross-scan search across all detected pain points with keyword, severity, trend, source, and date range filters. Includes competitive gap extraction
- **Source Adapters** — Pluggable data collection adapters: Reddit (subreddit + search), Google Autocomplete (pain-related prefixes), Twitter (API v2 search), Review Sites (G2/Capterra scraping), Regulatory RSS feeds

### Added — FinServ Intelligence Platform
- **Team Management** — Multi-tenant team system with role-based access (admin/analyst/viewer), invite/remove members, plan-based seat limits (Analyst/Team/Business/Enterprise tiers)
- **Sector Taxonomy** — 6 financial sectors (Fund Services, Banking, Audit & Accounting, Wealth Management, Fiduciary, Accounting & Tax) with sub-categories and per-sector pain aggregation
- **Regulatory Radar** — Ingest regulations from RSS feeds (CSSF, FCA, SEC, ESMA, EBA), track status (proposed/active/enforced/superseded), impact maps across sectors, severity scoring
- **Vendor Pain Map** — Track financial services vendors, monitor vendor-specific pain signals, rank pains by intensity, view sector-filtered vendor landscapes
- **Practice Intelligence** — Three-tab intelligence dashboard: Practice Pains (operational/technology/talent/regulatory/client categories), Service Opportunities (demand indicators + opportunity scoring), Talent Signals (hiring/retention/skills gap/compensation trends)
- **Fund Operations Intelligence** — Operational pain index across 6 fund ops areas (NAV Calculation, Transfer Agency, Reporting, KYC/AML, Investor Communications, Reconciliation) with intensity bars and trend indicators
- **Provider Comparison** — Side-by-side comparison of 2-5 fund service providers showing pain counts, average intensity, top pains, and operational area breakdowns
- **API Key Management** — Generate, list, and revoke API keys (`sq_` prefix, SHA-256 hashed). Plan-based rate limits: Team 1K/day, Business 10K/day, Enterprise 100K/day. Full audit logging
- **Report Generation** — CSV/JSON export for vendor pains, regulations, and sector overviews. Business/Enterprise plan only. Team branding in JSON output

### Added — Core Engine
- **Scan Engine** — Orchestrates multi-source pain discovery with configurable adapters, deduplication, and batch database persistence
- **Pain Analysis Pipeline** — Automated AI analysis of raw scan results producing structured pain intelligence
- **Solution Idea Generation** — AI-generated solution ideas from detected pain points with feasibility and market size estimates
- **Contributor System** — Track and reward community contributors with reputation scoring, auto-approve thresholds, and admin contributor management

### Database
- New tables: `teams`, `teamMembers`, `trackedVendors`, `regulations`, `vendorPains`, `alertConfigs`, `apiKeys`, `apiKeyAuditLog`, `painPoints`, `scans`, `solutionIdeas`, `users`, `userTokens`
- Migration scripts: `migrate-finserv-phase1.sql`, inline Drizzle schema definitions with IF NOT EXISTS pattern

### API Endpoints (new — User Auth)
- `POST /api/v1/auth/signup` — User registration with plan selection
- `POST /api/v1/auth/user-login` — User login (access + refresh tokens)
- `POST /api/v1/auth/user-logout` — Revoke refresh token
- `POST /api/v1/auth/refresh` — Rotate access token

### API Endpoints (new — PainGaps Retail)
- `GET/POST /api/v1/scans` — List/create pain scans
- `GET /api/v1/scans/:id` — Scan detail with pain points
- `POST /api/v1/scans/:id/run` — Execute scan with adapters
- `GET /api/v1/pain-points` — List pain points (filtered)
- `GET /api/v1/pain-points/:id` — Pain point detail
- `POST /api/v1/pain-points/:id/analyze` — AI analysis
- `GET /api/v1/universe/search` — Pro-only cross-scan search

### API Endpoints (new — FinServ Intelligence)
- `GET /api/v1/finserv/sectors` — List sector taxonomy
- `GET /api/v1/finserv/sectors/:sectorId/pains` — Sector pain aggregation
- `GET/POST /api/v1/finserv/regulations` — List/add regulations
- `GET /api/v1/finserv/regulations/:regId` — Regulation detail
- `GET/POST /api/v1/finserv/vendors` — List/add tracked vendors
- `GET/DELETE /api/v1/finserv/vendors/:vendorId` — Vendor detail/remove
- `GET /api/v1/finserv/vendors/compare` — Multi-vendor comparison
- `GET/POST/DELETE /api/v1/finserv/alerts` — Alert configuration
- `GET/POST/PUT/DELETE /api/v1/finserv/teams` — Team CRUD
- `GET/POST/DELETE /api/v1/finserv/teams/:teamId/members` — Member management
- `GET /api/v1/finserv/practice/dashboard` — Practice pains
- `GET /api/v1/finserv/practice/opportunities` — Service opportunities
- `GET /api/v1/finserv/practice/talent` — Talent signals
- `GET /api/v1/finserv/fund-ops/index` — Fund ops pain index
- `GET /api/v1/finserv/fund-ops/providers/compare` — Provider comparison
- `GET/POST/DELETE /api/v1/finserv/api-keys` — API key management
- `POST /api/v1/finserv/reports/generate` — Report generation

### API Endpoints (new — Billing)
- `POST /api/v1/billing/checkout` — Create Stripe checkout session
- `POST /api/v1/billing/portal` — Create Stripe billing portal session
- `POST /api/v1/billing/webhook` — Stripe webhook handler

### Changed
- OpenAI client initialization changed to lazy-init pattern to prevent build-time failures when env vars aren't set
- Plan system extended with FinServ tiers (Analyst/Team/Business/Enterprise) alongside retail tiers (Free/Starter/Pro)

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
