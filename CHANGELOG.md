# Changelog

All notable changes to StackQuadrant are documented here.

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
