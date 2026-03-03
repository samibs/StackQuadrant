# Contributing to StackQuadrant

Thanks for your interest in contributing to StackQuadrant.

## How to Contribute

### Reporting Issues
- Use [GitHub Issues](https://github.com/samibs/StackQuadrant/issues) for bug reports and feature requests
- Include steps to reproduce for bugs
- Include screenshots for UI issues

### Submitting Changes
1. Fork the repository
2. Create a feature branch from `master`
3. Make your changes
4. Run `npm run build` to verify no TypeScript errors
5. Submit a pull request with a clear description

### Development Setup
```bash
git clone https://github.com/samibs/StackQuadrant.git
cd StackQuadrant
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
npm run db:push
npm run db:seed
npm run dev
```

### Code Style
- TypeScript with strict mode
- CSS Custom Properties for theming (no CSS modules)
- Server Components by default, `"use client"` only when needed
- Drizzle ORM for database queries
- Inline styles + Tailwind utilities for layout

### Project Structure
- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — Reusable UI components
- `src/lib/db/` — Schema, queries, seed data
- `src/lib/utils/` — Shared utilities
- `scripts/` — Standalone scripts (sync, discovery, scoring)

## Showcase Submissions

Want to add your AI-built project to the showcase? Use the [submission form](https://stackquadrant.com/showcase/submit) — no pull request needed.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
