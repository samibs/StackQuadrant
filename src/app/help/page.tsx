import Link from "next/link";
import { Panel } from "@/components/layout/panel";

export const metadata = {
  title: "Help & User Guide",
  description: "Learn how to use StackQuadrant: understand scores, navigate tool comparisons, read quadrant charts, explore AI/LLM repos, submit showcase projects, use the Ask widget, suggest corrections, report issues, run PainGaps scans, and explore FinServ intelligence.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <div style={{ padding: "var(--grid-gap)" }}>
      <div
        className="px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
          Help & User Guide
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-2)", lineHeight: "1.6" }}>
          Everything you need to navigate StackQuadrant and interpret the data.
        </p>
      </div>

      <div className="help-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--grid-gap)" }}>
        {/* Column 1 — Scores & Dimensions */}
        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          <Panel title="Understanding Scores">
            <div className="flex flex-col gap-[var(--space-3)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>Every tool is evaluated on a <strong style={{ color: "var(--text-primary)" }}>0-10 scale</strong> across six dimensions. The overall score is a weighted average.</p>

              <div style={{ padding: "var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Score Colors</div>
                <div className="flex flex-col gap-[var(--space-2)]">
                  <div className="flex items-center gap-[var(--space-2)]">
                    <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--score-high)", flexShrink: 0 }} />
                    <span><strong style={{ color: "var(--score-high)" }}>8.0 - 10.0</strong> — Excellent. Industry-leading capability.</span>
                  </div>
                  <div className="flex items-center gap-[var(--space-2)]">
                    <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--score-mid)", flexShrink: 0 }} />
                    <span><strong style={{ color: "var(--score-mid)" }}>5.0 - 7.9</strong> — Average. Functional but with notable gaps.</span>
                  </div>
                  <div className="flex items-center gap-[var(--space-2)]">
                    <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--score-low)", flexShrink: 0 }} />
                    <span><strong style={{ color: "var(--score-low)" }}>0.0 - 4.9</strong> — Below average. Significant limitations.</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: "var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Score Ring</div>
                <p>The circular indicator next to each tool shows its overall score. The ring fills proportionally — a full ring means 10/10. The color follows the same scale above.</p>
              </div>

              <div style={{ padding: "var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Tooltips</div>
                <p>Hover over any score, dimension header, or metric label to see an explanation. Look for the <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "14px", height: "14px", borderRadius: "50%", border: "1px solid var(--border-strong)", fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", verticalAlign: "middle" }}>?</span> icon — it indicates additional context is available.</p>
              </div>
            </div>
          </Panel>

          <Panel title="Evaluation Dimensions">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              {[
                { name: "Code Generation", desc: "Quality and accuracy of generated code, correctness, and adherence to best practices." },
                { name: "Context Understanding", desc: "Ability to comprehend project structure, dependencies, and codebase-wide context." },
                { name: "Developer Experience", desc: "Ease of use, IDE integration, onboarding speed, and workflow friction reduction." },
                { name: "Multi-file Editing", desc: "Capability to make coordinated changes across multiple files consistently." },
                { name: "Debugging & Fixing", desc: "Effectiveness at identifying bugs, suggesting fixes, and resolving errors." },
                { name: "Ecosystem Integration", desc: "Support for languages, frameworks, package managers, and dev tools." },
              ].map((d, i) => (
                <div key={d.name} style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                  <div className="flex items-center gap-[var(--space-2)]">
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", width: "18px" }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "12px" }}>{d.name}</span>
                  </div>
                  <p style={{ marginTop: "2px", marginLeft: "26px" }}>{d.desc}</p>
                </div>
              ))}
              <p style={{ marginTop: "var(--space-2)" }}>
                Each dimension has a weight that determines its contribution to the overall score. Weights are visible in tooltips on the{" "}
                <Link href="/matrix" style={{ color: "var(--accent-primary)" }}>capability matrix</Link>.
              </p>
            </div>
          </Panel>
        </div>

        {/* Column 2 — Pages & Navigation */}
        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          <Panel title="Pages & Navigation">
            <div className="flex flex-col gap-[var(--space-3)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              {[
                { name: "Dashboard", href: "/", desc: "Overview showing top-ranked tools, featured repos, latest showcase projects, quadrants, and benchmarks at a glance." },
                { name: "Capability Matrix", href: "/matrix", desc: "Sortable, filterable table comparing all tools across every dimension. Click column headers to sort. Use category filters to narrow results." },
                { name: "Quadrants", href: "/quadrants", desc: "Interactive 2D charts positioning tools into four regions: Leaders, Visionaries, Challengers, and Niche Players. Click any dot to view the tool." },
                { name: "Benchmarks", href: "/benchmarks", desc: "Structured benchmark results for specific AI coding tasks. Compare tools side-by-side on real-world tasks." },
                { name: "Stacks", href: "/stacks", desc: "Evaluate tool combinations for specific workflows. Stacks are rated by how well the tools work together." },
                { name: "Repos", href: "/repos", desc: "AI/LLM Ecosystem Directory. Browse and filter open-source repos by category with automated GitHub metrics, auto-generated quality scores, and weekly discovery of new repos." },
                { name: "Showcase", href: "/showcase", desc: "Vibe Coding Showcase. Community-submitted projects built with AI tools. Auto-fill from GitHub, submit without a live URL for libraries/CLIs, and get quality-scored." },
                { name: "Best For", href: "/best-for", desc: "Find the right AI tool for your use case — rapid prototyping, enterprise, learning, open-source, and more." },
                { name: "Stack Builder", href: "/stack-builder", desc: "Interactive wizard to compose a custom tool stack, assign roles, and analyze strengths and gaps." },
                { name: "Pain Scans", href: "/scans", desc: "PainGaps Retail Intelligence. Run AI-powered scans on products to detect user pain points from Reddit, review sites, Google Autocomplete, and Twitter." },
                { name: "Intelligence", href: "/intelligence", desc: "FinServ Intelligence Platform. Team-based vendor pain maps, regulatory radar, practice intelligence, fund operations analysis, and sector taxonomy." },
                { name: "Pain Universe", href: "/universe", desc: "Pro-only cross-scan search across all detected pain points with keyword, severity, trend, source, and date range filters." },
                { name: "Methodology", href: "/methodology", desc: "Detailed explanation of our evaluation process, scoring criteria, and update cadence." },
              ].map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="no-underline"
                  style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", display: "block" }}
                >
                  <div style={{ fontWeight: 600, color: "var(--accent-primary)", fontSize: "13px" }}>{page.name}</div>
                  <p style={{ marginTop: "2px", color: "var(--text-secondary)", fontSize: "11px" }}>{page.desc}</p>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Keyboard Shortcuts">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
              {[
                { keys: "Cmd+K / Ctrl+K", action: "Open command palette — search tools, repos, showcase projects, quadrants, benchmarks, and stacks instantly" },
                { keys: "Esc", action: "Close command palette or any open dialog" },
              ].map((shortcut) => (
                <div key={shortcut.keys} className="flex items-start gap-[var(--space-3)]" style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                  <kbd style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, padding: "2px 8px",
                    background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)", whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {shortcut.keys}
                  </kbd>
                  <span style={{ lineHeight: "1.5" }}>{shortcut.action}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Ask Widget">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>Click the <strong style={{ color: "var(--text-primary)" }}>? button</strong> in the bottom-right corner to open the Ask + Suggest + Report widget. It has three modes:</p>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Ask Mode</div>
                <p style={{ fontSize: "11px" }}>Ask questions about tools, stacks, and quadrants. The AI uses MCP tools to query real data and returns structured answers with recommendation cards, confidence scores, rationale bullets, and alternatives. Use quick prompts or type your own question.</p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Suggest Mode</div>
                <p style={{ fontSize: "11px" }}>Submit structured corrections: add a missing tool, move a tool to a different quadrant, update metadata, merge duplicates, or flag discontinued tools. Include evidence links and your reasoning. Rate limited to 5 submissions per hour.</p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Report Mode</div>
                <p style={{ fontSize: "11px" }}>Report bugs (what happened vs expected, with optional screenshot) or data quality issues (specify the field, current value, and corrected value with evidence). Rate limited to 10 reports per hour.</p>
              </div>
              <p style={{ fontSize: "11px" }}>You can also click <strong style={{ color: "var(--text-primary)" }}>&quot;Suggest a correction&quot;</strong> on any tool detail page to open the widget pre-filled with that tool&apos;s context.</p>
            </div>
          </Panel>

          <Panel title="PainGaps Retail">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>PainGaps scans products and tools to detect real user pain points using AI-powered analysis across multiple data sources.</p>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Running Scans</div>
                <p style={{ fontSize: "11px" }}>Create a scan at <Link href="/scans" style={{ color: "var(--accent-primary)" }}>/scans</Link>, specify a product name, and run it. The engine collects pain signals from Reddit, Google Autocomplete, Twitter, and review sites, then uses AI to analyze intensity, frequency, and trends.</p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Plans & Limits</div>
                <p style={{ fontSize: "11px" }}>Free: 3 scans/month, 10 pain points. Starter: 20 scans/month, 100 pain points. Pro: unlimited scans, universe search, competitive gap extraction.</p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Pain Universe</div>
                <p style={{ fontSize: "11px" }}>Pro users can search across all scans at <Link href="/universe" style={{ color: "var(--accent-primary)" }}>/universe</Link> to find patterns, filter by severity/trend/source, and extract competitive gaps.</p>
              </div>
            </div>
          </Panel>

          <Panel title="FinServ Intelligence">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>Team-based intelligence platform for financial services professionals. Navigate to <Link href="/intelligence" style={{ color: "var(--accent-primary)" }}>/intelligence</Link> to access all modules.</p>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Teams & Sectors</div>
                <p style={{ fontSize: "11px" }}>Create a team, invite members (admin/analyst/viewer roles), and track vendors across 6 financial sectors. Plan tiers: Analyst, Team, Business, Enterprise.</p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Intelligence Modules</div>
                <p style={{ fontSize: "11px" }}>Regulatory Radar (track regulations from CSSF, FCA, SEC, ESMA, EBA), Vendor Pain Map (monitor vendor-specific pain signals), Practice Intelligence (pains, opportunities, talent), Fund Ops (operational pain index across NAV, TA, Reporting, KYC, Comms, Recon).</p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>API Keys & Reports</div>
                <p style={{ fontSize: "11px" }}>Team/Business/Enterprise plans can generate API keys for programmatic access. Business/Enterprise can export CSV/JSON reports for vendor pains, regulations, and sector overviews.</p>
              </div>
            </div>
          </Panel>
        </div>

        {/* Column 3 — Quadrants & Admin */}
        <div className="flex flex-col" style={{ gap: "var(--grid-gap)" }}>
          <Panel title="Quadrant Regions">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>Quadrant charts position tools on two axes. The chart is divided into four regions:</p>
              {[
                { name: "Leaders", color: "var(--quadrant-leaders)", desc: "High capability + high vision. Top-performing tools with broad, mature feature sets." },
                { name: "Visionaries", color: "var(--quadrant-visionaries)", desc: "Lower capability + high vision. Innovative approach but may lack execution maturity." },
                { name: "Challengers", color: "var(--quadrant-challengers)", desc: "High capability + lower vision. Strong execution on existing features, narrower scope." },
                { name: "Niche Players", color: "var(--quadrant-niche)", desc: "Lower capability + lower vision. Specialized or early-stage tools serving specific needs." },
              ].map((q) => (
                <div key={q.name} className="flex items-start gap-[var(--space-2)]" style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: q.color, flexShrink: 0, marginTop: "3px" }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{q.name}</div>
                    <p style={{ fontSize: "11px", marginTop: "2px" }}>{q.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Theme & Display">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>Click the sun/moon icon in the top-right corner to toggle between dark and light themes. Your preference is saved in your browser.</p>
              <p>The layout automatically adapts to your screen size — panels fill the available viewport on ultrawide monitors and stack vertically on smaller screens.</p>
            </div>
          </Panel>

          <Panel title="Repo Quality Scoring">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>Repository quality scores are <strong style={{ color: "var(--text-primary)" }}>auto-generated</strong> from GitHub metrics using a transparent methodology:</p>
              {[
                { name: "Documentation Quality (20%)", desc: "Docs site presence, description quality, stars as proxy for doc investment, contributor count." },
                { name: "Community Health (20%)", desc: "Stars, contributors, watchers, forks, and open issue ratio relative to popularity." },
                { name: "API Design & DX (20%)", desc: "Stars-to-issues ratio, typed language bonus, documentation site, permissive license." },
                { name: "Maintenance Velocity (15%)", desc: "Last commit freshness, weekly commits, release cadence, repo maturity." },
                { name: "Production Readiness (15%)", desc: "Battle-tested usage, peer review count, versioned releases, license, age." },
                { name: "Ecosystem Integration (10%)", desc: "Fork interest, language ecosystem popularity, license permissiveness, adoption." },
              ].map((d) => (
                <div key={d.name} style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "11px" }}>{d.name}</div>
                  <p style={{ fontSize: "11px", marginTop: "2px" }}>{d.desc}</p>
                </div>
              ))}
              <p style={{ fontSize: "11px" }}>Scores use logarithmic normalization for wide-range metrics. Each score includes evidence text visible on the repo detail page.</p>
            </div>
          </Panel>

          <Panel title="Showcase Submission">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>Submit your AI-built project at <Link href="/showcase/submit" style={{ color: "var(--accent-primary)" }}>/showcase/submit</Link>.</p>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>GitHub Auto-Fill</div>
                <p style={{ fontSize: "11px" }}>Paste your GitHub repo URL and click Import to auto-fill project name, description, tech stack (from languages and topics), and builder info.</p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>No Live URL Required</div>
                <p style={{ fontSize: "11px" }}>Frameworks, CLI tools, and libraries without a live web presence can be submitted — the live project URL is optional.</p>
              </div>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Verification Flow</div>
                <p style={{ fontSize: "11px" }}>Submit → verify your email → admin reviews → published. Quality-scored on: does it work, code quality, and shipped status.</p>
              </div>
            </div>
          </Panel>

          <Panel title="Admin Guide">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>Admins can manage all content through the <Link href="/admin/login" style={{ color: "var(--accent-primary)" }}>admin dashboard</Link>.</p>
              <div style={{ padding: "var(--space-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>What you can manage:</div>
                <ul style={{ paddingLeft: "16px", margin: 0 }}>
                  <li>Add, edit, and remove AI tools with dimension scores</li>
                  <li>Create and position tools on quadrant charts</li>
                  <li>Publish benchmark results with structured metrics</li>
                  <li>Define and rate tool stacks for workflows</li>
                  <li>Add AI/LLM repos, trigger GitHub sync, score quality dimensions</li>
                  <li>Manage repo categories (add, edit, reorder)</li>
                  <li>Moderate showcase submissions (approve, reject, quality-score)</li>
                  <li>Review community suggestions (approve, reject, request info)</li>
                  <li>Triage bug reports and data quality issues</li>
                  <li>Execute change jobs and track tool changelogs</li>
                </ul>
              </div>
              <p>All entities have a <strong style={{ color: "var(--text-primary)" }}>published</strong> status — unpublished items are only visible in the admin panel. Showcase projects follow a verification pipeline: submitted → email verified → admin review → published.</p>
            </div>
          </Panel>

          <Panel title="Data & API">
            <div className="flex flex-col gap-[var(--space-2)]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p>All data is available through a public REST API. No authentication required for read endpoints.</p>
              <div style={{ padding: "var(--space-2)", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                <code style={{ fontSize: "11px", color: "var(--accent-primary)" }}>GET /api/v1/tools</code>
                <span style={{ fontSize: "11px", marginLeft: "var(--space-2)" }}>— list all published tools with scores</span>
              </div>
              <div style={{ padding: "var(--space-2)", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                <code style={{ fontSize: "11px", color: "var(--accent-primary)" }}>GET /api/v1/repos</code>
                <span style={{ fontSize: "11px", marginLeft: "var(--space-2)" }}>— list published repos with GitHub metrics</span>
              </div>
              <div style={{ padding: "var(--space-2)", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                <code style={{ fontSize: "11px", color: "var(--accent-primary)" }}>GET /api/v1/showcase</code>
                <span style={{ fontSize: "11px", marginLeft: "var(--space-2)" }}>— list published showcase projects</span>
              </div>
              <div style={{ padding: "var(--space-2)", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                <code style={{ fontSize: "11px", color: "var(--accent-primary)" }}>GET /api/v1/showcase/github-info?url=</code>
                <span style={{ fontSize: "11px", marginLeft: "var(--space-2)" }}>— fetch GitHub repo info for form auto-fill</span>
              </div>
              <div style={{ padding: "var(--space-2)", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                <code style={{ fontSize: "11px", color: "var(--accent-primary)" }}>GET /api/v1/search</code>
                <span style={{ fontSize: "11px", marginLeft: "var(--space-2)" }}>— search across all entities</span>
              </div>
              <p style={{ fontSize: "11px" }}>
                See the full API reference in the{" "}
                <Link href="https://github.com/samibs/StackQuadrant#api-endpoints" style={{ color: "var(--accent-primary)" }}>README</Link>.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
