# StackQuadrant

A data-driven intelligence platform for evaluating AI developer tools, open-source AI/LLM repositories, and community-built vibe-coded projects. Think Gartner Magic Quadrant, but built by developers for developers.

![StackQuadrant Dashboard](public/screenshot-dashboard.png)

## Features

### AI Developer Tool Evaluations
- **AI Tool Capability Matrix** — Score tools across 6 dimensions (Code Generation, Context Understanding, Developer Experience, Multi-file Editing, Debugging & Fixing, Ecosystem Integration)
- **Magic Quadrants** — Interactive 2D positioning charts showing tool landscape (Leaders, Visionaries, Challengers, Niche)
- **Real-World Benchmarks** — Structured benchmark results for AI coding tasks
- **Stack Ratings** — Evaluate tool combinations for specific development workflows
- **Score History & Trends** — Track how tool scores change over time with sparkline visualizations
- **Best For Categories** — Find the right tool for your use case (rapid prototyping, enterprise, learning, etc.)
- **Stack Builder** — Interactive wizard to compose and analyze custom tool stacks

### AI/LLM Ecosystem Directory
- **Repository Evaluations** — Gartner-style analysis of AI/LLM GitHub repos (frameworks, agents, RAG, vector DBs, inference engines, etc.)
- **Automated GitHub Metrics** — Stars, forks, contributors, weekly commits, releases synced every 6 hours
- **Quality Scoring** — 6 dimensions: Documentation Quality, Community Health, Maintenance Velocity, API Design/DX, Production Readiness, Ecosystem Integration
- **10 Categories** — LLM Frameworks, Agent Frameworks, Fine-tuning Tools, RAG Libraries, Vector Databases, Inference Engines, Prompt Engineering, AI DevOps, Model Serving, Evaluation & Testing

### Vibe Coding Showcase
- **Community Submissions** — Developers submit projects built with AI-assisted coding tools
- **Email Verification** — Automated verification flow before admin review
- **Quality Scoring** — Projects rated on: Does it work? Code quality? Is it shipped?
- **Built-With Pages** — Browse projects filtered by the AI tool used to build them

### Platform Features
- **Contextual Tooltips** — Hover any score, dimension header, or metric for explanations with evidence
- **In-App Help** — Comprehensive guide to scores, navigation, and methodology at `/help`
- **Command Palette** — `Cmd+K` / `Ctrl+K` search across tools, repos, showcase projects, quadrants, benchmarks, and stacks
- **Dark/Light Theme** — Intelligence dashboard aesthetic with theme toggle
- **Responsive Layout** — Scales from mobile phones to 34"+ ultrawide monitors
- **Admin Dashboard** — Full CRUD for managing all content, repo syncing, showcase moderation
- **Evaluation Methodology** — Transparent scoring process documentation at `/methodology`

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components, API Routes)
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Styling**: CSS Custom Properties design tokens + Tailwind CSS utilities
- **Visualizations**: Custom SVG components (score rings, radar charts, quadrant charts, score bars, sparklines)
- **Animations**: Framer Motion
- **Auth**: JWT (jose + bcryptjs)
- **Search**: cmdk command palette
- **Email**: Nodemailer (Zoho SMTP)
- **GitHub Sync**: Native fetch against GitHub REST API v3 with rate limit tracking
- **Process Manager**: PM2 with cron scheduling for background sync
- **Typography**: JetBrains Mono (data) + Inter (UI)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 16 (or Docker)

### Setup

```bash
# Clone the repository
git clone https://github.com/samibs/StackQuadrant.git
cd StackQuadrant

# Install dependencies
npm install

# Start PostgreSQL (if using Docker)
docker compose up -d

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, GITHUB_TOKEN, etc.

# Push database schema
npm run db:push

# Seed with sample data (15 AI tools, benchmarks, stacks)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Admin Access

After seeding, log in at `/admin/login`:
- **Email**: `admin@stackquadrant.dev`
- **Password**: `admin123!`

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard (3-col viewport-filling grid)
│   ├── matrix/                     # Capability matrix (sortable, filterable)
│   ├── quadrants/                  # Magic quadrant views (responsive SVG)
│   ├── tools/[slug]/               # Tool detail (radar chart, dimension scores, score history)
│   ├── benchmarks/                 # Benchmark results
│   ├── stacks/                     # Stack ratings
│   ├── repos/                      # AI/LLM repository directory
│   ├── repos/[slug]/               # Repo detail (GitHub metrics, radar chart)
│   ├── repos/categories/           # Repo category filtered views
│   ├── showcase/                   # Vibe coding showcase gallery
│   ├── showcase/[slug]/            # Project detail page
│   ├── showcase/submit/            # Community submission form
│   ├── showcase/verify/            # Email verification landing
│   ├── built-with/[toolSlug]/      # Projects filtered by AI tool
│   ├── best-for/                   # Best tool for use case pages
│   ├── stack-builder/              # Interactive stack builder wizard
│   ├── compare/                    # Side-by-side tool comparison
│   ├── methodology/                # Evaluation methodology
│   ├── help/                       # In-app help & user guide
│   ├── admin/                      # Admin dashboard (CRUD)
│   └── api/v1/                     # REST API
│       ├── tools/                  # Public tool endpoints
│       ├── quadrants/              # Public quadrant endpoints
│       ├── benchmarks/             # Public benchmark endpoints
│       ├── stacks/                 # Public stack endpoints
│       ├── repos/                  # Public repo endpoints
│       ├── showcase/               # Public showcase + submission endpoints
│       ├── search/                 # Search index
│       ├── auth/login/             # Admin authentication
│       ├── subscribers/            # Newsletter signup
│       └── admin/                  # Admin CRUD endpoints
├── components/
│   ├── layout/                     # Header, Panel, ThemeProvider
│   ├── visualizations/             # ScoreRing, RadarChart, QuadrantChart, ScoreBar, Sparkline
│   ├── seo/                        # JSON-LD structured data
│   └── ui/                         # Tooltip, InfoIcon, Skeleton, CommandPalette, Breadcrumb
├── lib/
│   ├── db/                         # Schema, queries, seed
│   ├── services/                   # GitHub API service
│   ├── hooks/                      # useAdmin hook
│   └── utils/                      # API helpers, auth, email, validation, rate limiting
├── styles/
│   └── tokens.css                  # Design tokens (dark/light themes)
└── scripts/
    └── github-sync-worker.ts       # Background GitHub metrics sync (PM2 cron)
```

## Scoring System

### Tool Scoring
All tools are scored on a **0-10 scale** across six dimensions:

| Score Range | Color | Meaning |
|-------------|-------|---------|
| 8.0 - 10.0 | Green | Excellent |
| 5.0 - 7.9 | Yellow | Average |
| 0.0 - 4.9 | Red | Below average |

The **Overall Score** is a weighted average of all dimension scores. Hover any score in the app for context-specific explanations.

### Repository Scoring
Repos are evaluated across 6 quality dimensions with configurable weights:
- Documentation Quality (20%)
- Community Health (20%)
- API Design / Developer Experience (20%)
- Maintenance Velocity (15%)
- Production Readiness (15%)
- Ecosystem Integration (10%)

### Showcase Quality Scoring
Community projects are rated on three criteria (each 0-10):
- **Works** — Does the project function as described?
- **Code Quality** — Is the codebase well-structured?
- **Shipped** — Is it deployed and accessible?

## API Endpoints

### Public (no auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tools` | List published tools (paginated, sortable, filterable) |
| GET | `/api/v1/tools/:slug` | Tool detail with scores, benchmarks, stacks |
| GET | `/api/v1/quadrants` | List published quadrants |
| GET | `/api/v1/quadrants/:slug` | Quadrant with tool positions |
| GET | `/api/v1/benchmarks` | List published benchmarks |
| GET | `/api/v1/benchmarks/:slug` | Benchmark with results |
| GET | `/api/v1/stacks` | List published stacks |
| GET | `/api/v1/stacks/:slug` | Stack with tools and metrics |
| GET | `/api/v1/repos` | List published repos (paginated, filterable by category) |
| GET | `/api/v1/repos/:slug` | Repo detail with scores and GitHub metrics |
| GET | `/api/v1/repos/categories` | Repo categories with counts |
| GET | `/api/v1/showcase` | List published showcase projects |
| GET | `/api/v1/showcase/built-with/:toolSlug` | Projects built with a specific tool |
| POST | `/api/v1/showcase/submit` | Submit a project (rate limited: 3/hr) |
| GET | `/api/v1/showcase/verify?token=` | Email verification callback |
| GET | `/api/v1/search` | Search index for command palette |
| POST | `/api/v1/subscribers` | Newsletter signup |
| GET | `/api/health` | Health check |

### Admin (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Admin login |
| GET/POST | `/api/v1/admin/tools` | List/create tools |
| GET/PUT/DELETE | `/api/v1/admin/tools/:id` | Tool CRUD |
| PUT | `/api/v1/admin/tools/:id/scores` | Update tool dimension scores |
| GET/POST | `/api/v1/admin/quadrants` | List/create quadrants |
| PUT/DELETE | `/api/v1/admin/quadrants/:id` | Quadrant CRUD |
| PUT | `/api/v1/admin/quadrants/:id/positions` | Update tool positions |
| GET/POST | `/api/v1/admin/benchmarks` | List/create benchmarks |
| PUT/DELETE | `/api/v1/admin/benchmarks/:id` | Benchmark CRUD |
| POST | `/api/v1/admin/benchmarks/:id/results` | Add benchmark results |
| GET/POST | `/api/v1/admin/stacks` | List/create stacks |
| PUT/DELETE | `/api/v1/admin/stacks/:id` | Stack CRUD |
| GET/POST | `/api/v1/admin/repos` | List/create repos |
| GET/PUT/DELETE | `/api/v1/admin/repos/:id` | Repo CRUD |
| PUT | `/api/v1/admin/repos/:id/scores` | Update repo dimension scores |
| POST | `/api/v1/admin/repos/:id/sync` | Trigger GitHub sync for one repo |
| GET/POST | `/api/v1/admin/repo-categories` | List/create repo categories |
| PUT/DELETE | `/api/v1/admin/repo-categories/:id` | Category CRUD |
| POST | `/api/v1/admin/github-sync` | Bulk sync all repos from GitHub |
| GET | `/api/v1/admin/showcase` | List all showcase submissions |
| GET/PUT | `/api/v1/admin/showcase/:id` | View/edit submission |
| POST | `/api/v1/admin/showcase/:id/approve` | Approve and publish |
| POST | `/api/v1/admin/showcase/:id/reject` | Reject with reason |
| POST | `/api/v1/admin/showcase/:id/score` | Set quality scores |

## Database Commands

```bash
npm run db:generate    # Generate migration files
npm run db:migrate     # Run migrations
npm run db:push        # Push schema (dev mode)
npm run db:seed        # Seed sample data
npm run db:studio      # Open Drizzle Studio
```

## GitHub Sync

The platform automatically syncs GitHub metrics for all repositories every 6 hours via a PM2 cron job. You can also trigger manual syncs through the admin API.

```bash
# Manual sync
npx tsx scripts/github-sync-worker.ts

# PM2 manages the schedule (see ecosystem.config.js)
pm2 start ecosystem.config.js
```

Required: Set `GITHUB_TOKEN` in your `.env` for higher rate limits (5,000 requests/hour authenticated vs 60/hour unauthenticated).

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `Esc` | Close command palette / dialogs |

## License

MIT
