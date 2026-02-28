import "dotenv/config";
import { db } from "./index";
import { tools, dimensions, toolScores, quadrants, quadrantPositions, benchmarks, benchmarkResults, stacks, stackTools, adminUsers } from "./schema";
import { hash } from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // 1. Dimensions (6 evaluation axes)
  const dimensionData = [
    { name: "Code Generation", slug: "code-generation", description: "Quality and accuracy of generated code, including correctness, completeness, and adherence to best practices.", weight: "1.00", displayOrder: 1 },
    { name: "Context Understanding", slug: "context-understanding", description: "Ability to comprehend project structure, dependencies, and codebase-wide context for accurate assistance.", weight: "1.00", displayOrder: 2 },
    { name: "Developer Experience", slug: "developer-experience", description: "Ease of use, IDE integration quality, onboarding speed, and workflow friction reduction.", weight: "1.00", displayOrder: 3 },
    { name: "Multi-file Editing", slug: "multi-file-editing", description: "Capability to make coordinated changes across multiple files while maintaining consistency.", weight: "0.90", displayOrder: 4 },
    { name: "Debugging & Fixing", slug: "debugging-fixing", description: "Effectiveness at identifying bugs, suggesting fixes, and resolving errors in existing code.", weight: "0.90", displayOrder: 5 },
    { name: "Ecosystem Integration", slug: "ecosystem-integration", description: "Support for various languages, frameworks, package managers, and development tools.", weight: "0.80", displayOrder: 6 },
  ];

  const insertedDimensions = await db.insert(dimensions).values(dimensionData).returning();
  console.log(`  Inserted ${insertedDimensions.length} dimensions`);

  // 2. Tools (15 AI coding tools)
  const toolData = [
    { name: "Claude Code", slug: "claude-code", description: "Anthropic's agentic coding tool that lives in the terminal. Understands entire codebases, executes multi-step tasks, and handles complex refactoring autonomously.", websiteUrl: "https://docs.anthropic.com/en/docs/claude-code", category: "AI Coding Agent", vendor: "Anthropic", status: "published", overallScore: "9.2" },
    { name: "Cursor", slug: "cursor", description: "AI-first code editor built on VS Code with deep AI integration. Features tab-completion, multi-file editing, and chat-driven development.", websiteUrl: "https://cursor.com", category: "AI Code Editor", vendor: "Anysphere", status: "published", overallScore: "8.8" },
    { name: "GitHub Copilot", slug: "github-copilot", description: "GitHub's AI pair programmer powered by OpenAI. Provides inline suggestions, chat assistance, and workspace-aware completions.", websiteUrl: "https://github.com/features/copilot", category: "AI Code Assistant", vendor: "GitHub / Microsoft", status: "published", overallScore: "8.1" },
    { name: "Windsurf", slug: "windsurf", description: "Codeium's AI-powered IDE with Cascade flow-based editing. Combines AI suggestions with intuitive multi-file workflows.", websiteUrl: "https://windsurf.com", category: "AI Code Editor", vendor: "Codeium", status: "published", overallScore: "8.0" },
    { name: "Aider", slug: "aider", description: "Open-source AI pair programming tool for the terminal. Supports multiple LLMs and excels at multi-file editing with git integration.", websiteUrl: "https://aider.chat", category: "AI Coding Agent", vendor: "Open Source", status: "published", overallScore: "7.9" },
    { name: "Cline", slug: "cline", description: "Autonomous coding agent for VS Code. Can plan, create, and edit files with human-in-the-loop approval for each step.", websiteUrl: "https://github.com/cline/cline", category: "AI Coding Agent", vendor: "Open Source", status: "published", overallScore: "7.7" },
    { name: "Amazon Q Developer", slug: "amazon-q-developer", description: "AWS's AI assistant for software development. Strong at AWS service integration, code transformation, and security scanning.", websiteUrl: "https://aws.amazon.com/q/developer/", category: "AI Code Assistant", vendor: "Amazon Web Services", status: "published", overallScore: "7.4" },
    { name: "Tabnine", slug: "tabnine", description: "AI code assistant focused on privacy and enterprise. Runs models locally or in private cloud with team-trained completions.", websiteUrl: "https://www.tabnine.com", category: "AI Code Assistant", vendor: "Tabnine", status: "published", overallScore: "6.8" },
    { name: "Codium / Qodo", slug: "codium-qodo", description: "AI-powered test generation and code integrity tool. Specializes in generating meaningful tests and reviewing code quality.", websiteUrl: "https://www.qodo.ai", category: "AI Testing Tool", vendor: "Qodo", status: "published", overallScore: "7.0" },
    { name: "Sourcegraph Cody", slug: "sourcegraph-cody", description: "AI coding assistant with deep codebase understanding via Sourcegraph's code graph. Excels at large monorepo navigation.", websiteUrl: "https://sourcegraph.com/cody", category: "AI Code Assistant", vendor: "Sourcegraph", status: "published", overallScore: "7.5" },
    { name: "Replit Agent", slug: "replit-agent", description: "Full-stack AI agent that builds and deploys applications from natural language descriptions in Replit's cloud IDE.", websiteUrl: "https://replit.com", category: "AI Coding Agent", vendor: "Replit", status: "published", overallScore: "7.2" },
    { name: "Devin", slug: "devin", description: "Cognition's autonomous AI software engineer. Handles full development workflows including planning, coding, testing, and debugging.", websiteUrl: "https://devin.ai", category: "AI Coding Agent", vendor: "Cognition", status: "published", overallScore: "7.6" },
    { name: "Copilot Workspace", slug: "copilot-workspace", description: "GitHub's task-oriented development environment. Translates issues into implementation plans with multi-file code generation.", websiteUrl: "https://githubnext.com/projects/copilot-workspace", category: "AI Code Editor", vendor: "GitHub / Microsoft", status: "published", overallScore: "7.3" },
    { name: "Continue", slug: "continue-dev", description: "Open-source AI code assistant that connects any LLM to any IDE. Highly customizable with support for local and cloud models.", websiteUrl: "https://continue.dev", category: "AI Code Assistant", vendor: "Open Source", status: "published", overallScore: "7.1" },
    { name: "Augment Code", slug: "augment-code", description: "Enterprise AI coding platform with deep codebase understanding. Designed for large teams with context-aware suggestions.", websiteUrl: "https://www.augmentcode.com", category: "AI Code Assistant", vendor: "Augment", status: "published", overallScore: "7.3" },
  ];

  const insertedTools = await db.insert(tools).values(toolData).returning();
  console.log(`  Inserted ${insertedTools.length} tools`);

  // Build lookup maps
  const toolMap = Object.fromEntries(insertedTools.map((t) => [t.slug, t.id]));
  const dimMap = Object.fromEntries(insertedDimensions.map((d) => [d.slug, d.id]));

  // 3. Tool Scores (scores for each tool across dimensions)
  const scoreData: Array<{ toolId: string; dimensionId: string; score: string; evidence: string; evaluatedBy: string }> = [
    // Claude Code
    { toolId: toolMap["claude-code"], dimensionId: dimMap["code-generation"], score: "9.5", evidence: "Top-tier code generation with Claude Opus 4 and Sonnet 4. Produces production-ready code with strong adherence to project conventions.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["claude-code"], dimensionId: dimMap["context-understanding"], score: "9.4", evidence: "Reads entire repositories, understands file relationships, import chains, and project architecture through agentic exploration.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["claude-code"], dimensionId: dimMap["developer-experience"], score: "8.8", evidence: "Terminal-native workflow with fast iteration. CLAUDE.md project memory provides persistent context. Learning curve for terminal-centric users.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["claude-code"], dimensionId: dimMap["multi-file-editing"], score: "9.6", evidence: "Excels at coordinated multi-file changes. Can refactor across entire codebases autonomously with proper dependency tracking.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["claude-code"], dimensionId: dimMap["debugging-fixing"], score: "9.2", evidence: "Strong diagnostic capability. Reads logs, traces errors, and applies fixes across multiple files. Runs tests to verify fixes.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["claude-code"], dimensionId: dimMap["ecosystem-integration"], score: "8.7", evidence: "Works with any language or framework via terminal. MCP server support for extended tooling. Git integration built-in.", evaluatedBy: "StackQuadrant Team" },

    // Cursor
    { toolId: toolMap["cursor"], dimensionId: dimMap["code-generation"], score: "9.0", evidence: "High-quality completions with tab-accept flow. Composer mode generates multi-file changes effectively.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cursor"], dimensionId: dimMap["context-understanding"], score: "8.8", evidence: "Good codebase indexing with @-mentions for files and docs. Understands project structure well within IDE context.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cursor"], dimensionId: dimMap["developer-experience"], score: "9.2", evidence: "Familiar VS Code interface with seamless AI integration. Low friction, fast onboarding, excellent inline suggestions.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cursor"], dimensionId: dimMap["multi-file-editing"], score: "8.9", evidence: "Composer mode handles multi-file edits well. Apply-all functionality streamlines batch changes.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cursor"], dimensionId: dimMap["debugging-fixing"], score: "8.4", evidence: "Good at inline error detection and quick fixes. Less autonomous than agent-based tools for complex debugging.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cursor"], dimensionId: dimMap["ecosystem-integration"], score: "8.5", evidence: "Full VS Code extension ecosystem. Supports all major languages. Multiple model provider options.", evaluatedBy: "StackQuadrant Team" },

    // GitHub Copilot
    { toolId: toolMap["github-copilot"], dimensionId: dimMap["code-generation"], score: "8.3", evidence: "Reliable inline completions. Workspace agent improving with GPT-4o. Good for routine code patterns.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["github-copilot"], dimensionId: dimMap["context-understanding"], score: "7.8", evidence: "Workspace-aware through #file references. Improving with repo-wide indexing but still catches up to specialized tools.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["github-copilot"], dimensionId: dimMap["developer-experience"], score: "8.8", evidence: "Deeply integrated into VS Code and GitHub ecosystem. Low friction, familiar workflow. Enterprise SSO support.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["github-copilot"], dimensionId: dimMap["multi-file-editing"], score: "7.5", evidence: "Copilot Edits feature improving. Still behind Cursor and Claude Code for large-scale multi-file changes.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["github-copilot"], dimensionId: dimMap["debugging-fixing"], score: "8.0", evidence: "Good error explanation and fix suggestions. Workspace agent can run and fix tests.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["github-copilot"], dimensionId: dimMap["ecosystem-integration"], score: "8.9", evidence: "Best-in-class GitHub integration. Works across all major IDEs. Extensive language support.", evaluatedBy: "StackQuadrant Team" },

    // Windsurf
    { toolId: toolMap["windsurf"], dimensionId: dimMap["code-generation"], score: "8.2", evidence: "Solid code generation with Cascade flows. Good at following instructions for structured output.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["windsurf"], dimensionId: dimMap["context-understanding"], score: "8.0", evidence: "Good codebase awareness through indexing. Cascade flows maintain context across multi-step operations.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["windsurf"], dimensionId: dimMap["developer-experience"], score: "8.4", evidence: "Clean VS Code-based interface. Flow-based editing is intuitive. Free tier is generous.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["windsurf"], dimensionId: dimMap["multi-file-editing"], score: "8.0", evidence: "Cascade handles multi-file changes well. Preview and apply workflow is clear.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["windsurf"], dimensionId: dimMap["debugging-fixing"], score: "7.6", evidence: "Adequate debugging assistance. Can trace errors but less autonomous than agent-based tools.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["windsurf"], dimensionId: dimMap["ecosystem-integration"], score: "7.8", evidence: "VS Code extension support. Multiple model options. Growing ecosystem of integrations.", evaluatedBy: "StackQuadrant Team" },

    // Aider
    { toolId: toolMap["aider"], dimensionId: dimMap["code-generation"], score: "8.5", evidence: "Strong code generation across models. Architect mode plans before implementing. Git-aware diffs.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["aider"], dimensionId: dimMap["context-understanding"], score: "7.8", evidence: "Repo-map provides structural understanding. Manual file addition for context. Improving with tree-sitter.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["aider"], dimensionId: dimMap["developer-experience"], score: "7.2", evidence: "Terminal-based with learning curve. Powerful but requires CLI comfort. Excellent for power users.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["aider"], dimensionId: dimMap["multi-file-editing"], score: "8.6", evidence: "One of the best at coordinated multi-file edits. Git diff format ensures clean changes.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["aider"], dimensionId: dimMap["debugging-fixing"], score: "7.8", evidence: "Can read error output and fix iteratively. Linter integration helps catch issues.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["aider"], dimensionId: dimMap["ecosystem-integration"], score: "7.5", evidence: "Supports 30+ LLM providers. Works with any language. Git integration is excellent.", evaluatedBy: "StackQuadrant Team" },

    // Cline
    { toolId: toolMap["cline"], dimensionId: dimMap["code-generation"], score: "8.0", evidence: "Good code generation with human-in-the-loop approval. Plans before coding.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cline"], dimensionId: dimMap["context-understanding"], score: "7.6", evidence: "File exploration and codebase navigation. Can read and understand project structure autonomously.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cline"], dimensionId: dimMap["developer-experience"], score: "7.8", evidence: "VS Code extension with clear approval workflow. Good visibility into agent actions.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cline"], dimensionId: dimMap["multi-file-editing"], score: "7.9", evidence: "Can create and edit multiple files. Approval step for each change adds safety but slows workflow.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cline"], dimensionId: dimMap["debugging-fixing"], score: "7.5", evidence: "Can run commands and read output to diagnose issues. Iterative fix-test loops.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["cline"], dimensionId: dimMap["ecosystem-integration"], score: "7.4", evidence: "VS Code integration. Multiple model support. MCP server support for extended capabilities.", evaluatedBy: "StackQuadrant Team" },

    // Amazon Q Developer
    { toolId: toolMap["amazon-q-developer"], dimensionId: dimMap["code-generation"], score: "7.5", evidence: "Solid code generation, especially for AWS services. Java and Python are strongest.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["amazon-q-developer"], dimensionId: dimMap["context-understanding"], score: "7.2", evidence: "Good at understanding AWS architecture patterns. Workspace awareness improving.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["amazon-q-developer"], dimensionId: dimMap["developer-experience"], score: "7.6", evidence: "Good IDE integration. Free tier for individuals. Strong AWS console integration.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["amazon-q-developer"], dimensionId: dimMap["multi-file-editing"], score: "7.0", evidence: "Code transformation feature handles multi-file migrations. Less flexible for general multi-file edits.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["amazon-q-developer"], dimensionId: dimMap["debugging-fixing"], score: "7.6", evidence: "Good at AWS-related debugging. Security scanning built-in. Code transformation for upgrades.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["amazon-q-developer"], dimensionId: dimMap["ecosystem-integration"], score: "7.5", evidence: "Best-in-class AWS integration. Good IDE support. Limited outside AWS ecosystem.", evaluatedBy: "StackQuadrant Team" },

    // Tabnine
    { toolId: toolMap["tabnine"], dimensionId: dimMap["code-generation"], score: "6.8", evidence: "Reliable completions but less advanced than frontier-model tools. Team-trained models improve over time.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["tabnine"], dimensionId: dimMap["context-understanding"], score: "6.5", evidence: "Local context awareness. Team code patterns learned. Limited compared to cloud-based tools.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["tabnine"], dimensionId: dimMap["developer-experience"], score: "7.2", evidence: "Low latency, minimal disruption. Privacy-focused. Works across many IDEs.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["tabnine"], dimensionId: dimMap["multi-file-editing"], score: "5.8", evidence: "Primarily inline completions. Limited multi-file editing capabilities.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["tabnine"], dimensionId: dimMap["debugging-fixing"], score: "6.2", evidence: "Basic error detection and suggestions. Less capable than agent-based tools.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["tabnine"], dimensionId: dimMap["ecosystem-integration"], score: "7.5", evidence: "Wide IDE support. Local model option. Enterprise deployment flexibility.", evaluatedBy: "StackQuadrant Team" },

    // Codium / Qodo
    { toolId: toolMap["codium-qodo"], dimensionId: dimMap["code-generation"], score: "7.0", evidence: "Focused on test generation rather than general code. Produces high-quality test suites.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["codium-qodo"], dimensionId: dimMap["context-understanding"], score: "7.2", evidence: "Good at understanding code behavior for test generation. Analyzes function signatures and edge cases.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["codium-qodo"], dimensionId: dimMap["developer-experience"], score: "7.0", evidence: "IDE extensions and PR review integration. Specialized workflow for testing.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["codium-qodo"], dimensionId: dimMap["multi-file-editing"], score: "6.5", evidence: "Test generation can span files. Limited general multi-file editing.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["codium-qodo"], dimensionId: dimMap["debugging-fixing"], score: "7.4", evidence: "Strong at identifying edge cases and potential bugs through test generation.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["codium-qodo"], dimensionId: dimMap["ecosystem-integration"], score: "6.9", evidence: "Supports major testing frameworks. Git PR review integration. Growing CI/CD support.", evaluatedBy: "StackQuadrant Team" },

    // Sourcegraph Cody
    { toolId: toolMap["sourcegraph-cody"], dimensionId: dimMap["code-generation"], score: "7.8", evidence: "Good code generation with strong context from Sourcegraph's code graph.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["sourcegraph-cody"], dimensionId: dimMap["context-understanding"], score: "8.5", evidence: "Excellent codebase understanding via code graph. Best-in-class for large monorepo navigation.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["sourcegraph-cody"], dimensionId: dimMap["developer-experience"], score: "7.4", evidence: "VS Code and JetBrains support. Web interface. Requires Sourcegraph setup for full benefits.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["sourcegraph-cody"], dimensionId: dimMap["multi-file-editing"], score: "7.0", evidence: "Improving edit capabilities. Context advantage helps with coordinated changes.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["sourcegraph-cody"], dimensionId: dimMap["debugging-fixing"], score: "7.2", evidence: "Good at tracing code paths for debugging. Code graph helps identify related issues.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["sourcegraph-cody"], dimensionId: dimMap["ecosystem-integration"], score: "7.1", evidence: "Multiple LLM support. Enterprise code search integration. Growing IDE support.", evaluatedBy: "StackQuadrant Team" },

    // Replit Agent
    { toolId: toolMap["replit-agent"], dimensionId: dimMap["code-generation"], score: "7.5", evidence: "Full application generation from prompts. Good at scaffolding and prototyping.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["replit-agent"], dimensionId: dimMap["context-understanding"], score: "7.0", evidence: "Understands project structure within Replit environment. Limited to Replit workspace.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["replit-agent"], dimensionId: dimMap["developer-experience"], score: "7.8", evidence: "Lowest barrier to entry. Cloud IDE with instant deployment. Great for beginners and prototyping.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["replit-agent"], dimensionId: dimMap["multi-file-editing"], score: "7.2", evidence: "Creates and edits multiple files for full-stack apps. Limited precision for large codebases.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["replit-agent"], dimensionId: dimMap["debugging-fixing"], score: "6.8", evidence: "Can run code and fix errors iteratively. Limited debugging depth.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["replit-agent"], dimensionId: dimMap["ecosystem-integration"], score: "6.9", evidence: "Replit ecosystem. Built-in deployment. Limited to Replit-supported languages and frameworks.", evaluatedBy: "StackQuadrant Team" },

    // Devin
    { toolId: toolMap["devin"], dimensionId: dimMap["code-generation"], score: "8.0", evidence: "Strong code generation with autonomous planning. Can implement complex features end-to-end.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["devin"], dimensionId: dimMap["context-understanding"], score: "7.8", evidence: "Explores codebases autonomously. Uses browser and terminal for research. Good at understanding requirements.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["devin"], dimensionId: dimMap["developer-experience"], score: "7.0", evidence: "Asynchronous workflow. Less interactive than IDE tools. Good for fire-and-forget tasks.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["devin"], dimensionId: dimMap["multi-file-editing"], score: "8.2", evidence: "Handles multi-file changes autonomously. Plans before executing. Git PR workflow.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["devin"], dimensionId: dimMap["debugging-fixing"], score: "7.8", evidence: "Can reproduce issues, trace bugs, and implement fixes. Uses terminal and browser for debugging.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["devin"], dimensionId: dimMap["ecosystem-integration"], score: "7.0", evidence: "Works with standard dev tools. Slack integration. Limited IDE integration (cloud-based).", evaluatedBy: "StackQuadrant Team" },

    // Copilot Workspace
    { toolId: toolMap["copilot-workspace"], dimensionId: dimMap["code-generation"], score: "7.6", evidence: "Issue-to-code workflow with planning. Produces implementation plans with code changes.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["copilot-workspace"], dimensionId: dimMap["context-understanding"], score: "7.4", evidence: "GitHub repository awareness. Understands issues, PRs, and existing code.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["copilot-workspace"], dimensionId: dimMap["developer-experience"], score: "7.5", evidence: "Novel issue-driven workflow. Intuitive plan-review-apply process. Still in preview.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["copilot-workspace"], dimensionId: dimMap["multi-file-editing"], score: "7.6", evidence: "Plans multi-file changes from issues. Review before apply workflow.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["copilot-workspace"], dimensionId: dimMap["debugging-fixing"], score: "7.0", evidence: "Can address bug issues with planned fixes. Less ad-hoc than interactive tools.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["copilot-workspace"], dimensionId: dimMap["ecosystem-integration"], score: "7.0", evidence: "Deep GitHub integration. Limited to GitHub-hosted repos. Preview availability.", evaluatedBy: "StackQuadrant Team" },

    // Continue
    { toolId: toolMap["continue-dev"], dimensionId: dimMap["code-generation"], score: "7.4", evidence: "Quality depends on chosen model. Good prompt engineering and context management.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["continue-dev"], dimensionId: dimMap["context-understanding"], score: "7.0", evidence: "Configurable context providers. @-mentions for files and docs. Model-dependent quality.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["continue-dev"], dimensionId: dimMap["developer-experience"], score: "7.5", evidence: "Open-source and highly customizable. VS Code and JetBrains support. Bring-your-own-model.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["continue-dev"], dimensionId: dimMap["multi-file-editing"], score: "6.8", evidence: "Basic multi-file editing. Less polished than dedicated tools like Cursor or Aider.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["continue-dev"], dimensionId: dimMap["debugging-fixing"], score: "6.8", evidence: "Error diagnosis through chat. Model-dependent quality. Growing capability.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["continue-dev"], dimensionId: dimMap["ecosystem-integration"], score: "7.8", evidence: "Most flexible model support. Open architecture. Custom slash commands and context providers.", evaluatedBy: "StackQuadrant Team" },

    // Augment Code
    { toolId: toolMap["augment-code"], dimensionId: dimMap["code-generation"], score: "7.5", evidence: "Enterprise-focused code generation. Good at following team patterns and conventions.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["augment-code"], dimensionId: dimMap["context-understanding"], score: "8.0", evidence: "Strong codebase understanding for enterprise-scale repos. Team knowledge incorporation.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["augment-code"], dimensionId: dimMap["developer-experience"], score: "7.2", evidence: "VS Code integration. Enterprise SSO. Onboarding requires team setup.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["augment-code"], dimensionId: dimMap["multi-file-editing"], score: "7.0", evidence: "Improving multi-file capabilities. Context advantage helps with large changes.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["augment-code"], dimensionId: dimMap["debugging-fixing"], score: "7.0", evidence: "Team-aware debugging. Can leverage historical patterns for fix suggestions.", evaluatedBy: "StackQuadrant Team" },
    { toolId: toolMap["augment-code"], dimensionId: dimMap["ecosystem-integration"], score: "7.2", evidence: "Enterprise tool integration. SOC 2 compliance. SSO and team management.", evaluatedBy: "StackQuadrant Team" },
  ];

  await db.insert(toolScores).values(scoreData);
  console.log(`  Inserted ${scoreData.length} tool scores`);

  // 4. Quadrant — AI Coding Tools Magic Quadrant
  const [quadrant] = await db.insert(quadrants).values({
    title: "AI Coding Tools — 2026 Q1",
    slug: "ai-coding-tools-2026-q1",
    description: "Positioning of AI coding tools based on their ability to execute complex development tasks (x-axis) and completeness of vision for the future of AI-assisted development (y-axis). Leaders demonstrate both strong current capabilities and forward-thinking product direction.",
    xAxisLabel: "Ability to Execute",
    yAxisLabel: "Completeness of Vision",
    quadrantLabels: {
      topRight: "Leaders",
      topLeft: "Visionaries",
      bottomRight: "Challengers",
      bottomLeft: "Niche Players",
    },
    status: "published",
    publishedAt: new Date(),
  }).returning();

  // Quadrant positions (x: 0-100, y: 0-100)
  const positionData = [
    { quadrantId: quadrant.id, toolId: toolMap["claude-code"], xPosition: "88", yPosition: "90" },
    { quadrantId: quadrant.id, toolId: toolMap["cursor"], xPosition: "85", yPosition: "82" },
    { quadrantId: quadrant.id, toolId: toolMap["github-copilot"], xPosition: "78", yPosition: "75" },
    { quadrantId: quadrant.id, toolId: toolMap["windsurf"], xPosition: "72", yPosition: "70" },
    { quadrantId: quadrant.id, toolId: toolMap["aider"], xPosition: "70", yPosition: "62" },
    { quadrantId: quadrant.id, toolId: toolMap["cline"], xPosition: "65", yPosition: "58" },
    { quadrantId: quadrant.id, toolId: toolMap["devin"], xPosition: "60", yPosition: "78" },
    { quadrantId: quadrant.id, toolId: toolMap["sourcegraph-cody"], xPosition: "62", yPosition: "65" },
    { quadrantId: quadrant.id, toolId: toolMap["amazon-q-developer"], xPosition: "58", yPosition: "55" },
    { quadrantId: quadrant.id, toolId: toolMap["copilot-workspace"], xPosition: "52", yPosition: "72" },
    { quadrantId: quadrant.id, toolId: toolMap["replit-agent"], xPosition: "48", yPosition: "68" },
    { quadrantId: quadrant.id, toolId: toolMap["augment-code"], xPosition: "55", yPosition: "60" },
    { quadrantId: quadrant.id, toolId: toolMap["continue-dev"], xPosition: "45", yPosition: "52" },
    { quadrantId: quadrant.id, toolId: toolMap["codium-qodo"], xPosition: "40", yPosition: "42" },
    { quadrantId: quadrant.id, toolId: toolMap["tabnine"], xPosition: "38", yPosition: "35" },
  ];

  await db.insert(quadrantPositions).values(positionData);
  console.log(`  Inserted ${positionData.length} quadrant positions`);

  // 5. Benchmarks
  const benchmarkData = [
    {
      title: "Multi-file Refactoring Challenge",
      slug: "multi-file-refactoring-2026",
      description: "Tests each tool's ability to refactor a 500-line Express.js API from callbacks to async/await across 8 interconnected files while maintaining all 47 existing tests passing.",
      category: "Code Refactoring",
      methodology: "Each tool was given the same starter codebase with callback-based Express routes, middleware, and database queries. Tools were instructed to convert all asynchronous operations to async/await, update error handling to use try/catch, and ensure all tests pass. Scored on: completion percentage, test pass rate, code quality of output, and time taken. Run 3 times per tool, best result used.",
      metrics: [
        { name: "Completion", unit: "%", higherIsBetter: true },
        { name: "Tests Passing", unit: "/47", higherIsBetter: true },
        { name: "Time", unit: "min", higherIsBetter: false },
        { name: "Code Quality", unit: "/10", higherIsBetter: true },
      ],
      status: "published",
      publishedAt: new Date(),
    },
    {
      title: "Bug Detection & Fix Rate",
      slug: "bug-detection-fix-rate-2026",
      description: "Measures each tool's ability to identify and fix 12 planted bugs of varying severity in a React + Node.js full-stack application.",
      category: "Debugging",
      methodology: "A full-stack application with 12 intentionally planted bugs was provided: 4 syntax errors, 4 logic errors, and 4 subtle race conditions/security issues. Each tool was given the same instructions to find and fix all bugs. Scored on bugs found, bugs correctly fixed, false positives, and time to complete.",
      metrics: [
        { name: "Bugs Found", unit: "/12", higherIsBetter: true },
        { name: "Bugs Fixed", unit: "/12", higherIsBetter: true },
        { name: "False Positives", unit: "count", higherIsBetter: false },
        { name: "Time", unit: "min", higherIsBetter: false },
      ],
      status: "published",
      publishedAt: new Date(),
    },
    {
      title: "Greenfield App Scaffold",
      slug: "greenfield-app-scaffold-2026",
      description: "Tests ability to generate a complete CRUD application from a natural language specification: a task management API with authentication, database, and tests.",
      category: "Code Generation",
      methodology: "Each tool was given identical natural language specs for a task management REST API with: user authentication (JWT), CRUD operations for tasks and projects, PostgreSQL database with migrations, input validation, and test suite. Scored on feature completeness, code quality, test coverage, and whether the app runs without manual fixes.",
      metrics: [
        { name: "Features Complete", unit: "%", higherIsBetter: true },
        { name: "Runs First Try", unit: "yes/no", higherIsBetter: true },
        { name: "Test Coverage", unit: "%", higherIsBetter: true },
        { name: "Code Quality", unit: "/10", higherIsBetter: true },
      ],
      status: "published",
      publishedAt: new Date(),
    },
    {
      title: "Context Window Stress Test",
      slug: "context-window-stress-test-2026",
      description: "Evaluates how well tools maintain accuracy when working with large codebases that exceed typical context windows.",
      category: "Context Handling",
      methodology: "Each tool was tasked with making 5 specific changes across a 50,000-line TypeScript monorepo with 200+ files. Changes required understanding cross-module dependencies, shared types, and configuration files. Scored on changes correctly made, broken imports, missing updates, and whether the project compiles after changes.",
      metrics: [
        { name: "Changes Correct", unit: "/5", higherIsBetter: true },
        { name: "Broken Imports", unit: "count", higherIsBetter: false },
        { name: "Compiles Clean", unit: "yes/no", higherIsBetter: true },
        { name: "Time", unit: "min", higherIsBetter: false },
      ],
      status: "published",
      publishedAt: new Date(),
    },
    {
      title: "Test Generation Quality",
      slug: "test-generation-quality-2026",
      description: "Evaluates each tool's ability to generate meaningful, comprehensive tests for a set of 10 JavaScript/TypeScript functions of varying complexity.",
      category: "Testing",
      methodology: "10 functions were provided ranging from simple utilities to complex async state machines. Each tool was asked to generate comprehensive test suites. Scored on edge case coverage, assertion quality, test readability, and mutation testing survival rate.",
      metrics: [
        { name: "Edge Cases", unit: "%", higherIsBetter: true },
        { name: "Mutation Score", unit: "%", higherIsBetter: true },
        { name: "Readability", unit: "/10", higherIsBetter: true },
        { name: "False Passes", unit: "count", higherIsBetter: false },
      ],
      status: "published",
      publishedAt: new Date(),
    },
  ];

  const insertedBenchmarks = await db.insert(benchmarks).values(benchmarkData).returning();
  console.log(`  Inserted ${insertedBenchmarks.length} benchmarks`);

  const bmMap = Object.fromEntries(insertedBenchmarks.map((b) => [b.slug, b.id]));

  // Benchmark results (top tools only for brevity)
  const benchResultData: Array<{ benchmarkId: string; toolId: string; results: Record<string, number>; runDate: Date; runBy: string }> = [
    // Multi-file Refactoring
    { benchmarkId: bmMap["multi-file-refactoring-2026"], toolId: toolMap["claude-code"], results: { "Completion": 98, "Tests Passing": 47, "Time": 4.2, "Code Quality": 9.3 }, runDate: new Date("2026-02-15"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["multi-file-refactoring-2026"], toolId: toolMap["cursor"], results: { "Completion": 95, "Tests Passing": 46, "Time": 6.1, "Code Quality": 8.8 }, runDate: new Date("2026-02-15"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["multi-file-refactoring-2026"], toolId: toolMap["aider"], results: { "Completion": 92, "Tests Passing": 45, "Time": 5.5, "Code Quality": 8.5 }, runDate: new Date("2026-02-15"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["multi-file-refactoring-2026"], toolId: toolMap["github-copilot"], results: { "Completion": 85, "Tests Passing": 43, "Time": 8.3, "Code Quality": 8.0 }, runDate: new Date("2026-02-15"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["multi-file-refactoring-2026"], toolId: toolMap["devin"], results: { "Completion": 90, "Tests Passing": 44, "Time": 12.0, "Code Quality": 8.2 }, runDate: new Date("2026-02-15"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["multi-file-refactoring-2026"], toolId: toolMap["windsurf"], results: { "Completion": 88, "Tests Passing": 42, "Time": 7.8, "Code Quality": 7.9 }, runDate: new Date("2026-02-15"), runBy: "StackQuadrant Team" },

    // Bug Detection & Fix Rate
    { benchmarkId: bmMap["bug-detection-fix-rate-2026"], toolId: toolMap["claude-code"], results: { "Bugs Found": 11, "Bugs Fixed": 10, "False Positives": 1, "Time": 8.5 }, runDate: new Date("2026-02-16"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["bug-detection-fix-rate-2026"], toolId: toolMap["cursor"], results: { "Bugs Found": 10, "Bugs Fixed": 9, "False Positives": 2, "Time": 11.0 }, runDate: new Date("2026-02-16"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["bug-detection-fix-rate-2026"], toolId: toolMap["github-copilot"], results: { "Bugs Found": 9, "Bugs Fixed": 8, "False Positives": 3, "Time": 14.0 }, runDate: new Date("2026-02-16"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["bug-detection-fix-rate-2026"], toolId: toolMap["cline"], results: { "Bugs Found": 9, "Bugs Fixed": 8, "False Positives": 1, "Time": 15.0 }, runDate: new Date("2026-02-16"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["bug-detection-fix-rate-2026"], toolId: toolMap["devin"], results: { "Bugs Found": 10, "Bugs Fixed": 9, "False Positives": 2, "Time": 18.0 }, runDate: new Date("2026-02-16"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["bug-detection-fix-rate-2026"], toolId: toolMap["codium-qodo"], results: { "Bugs Found": 8, "Bugs Fixed": 7, "False Positives": 0, "Time": 12.0 }, runDate: new Date("2026-02-16"), runBy: "StackQuadrant Team" },

    // Greenfield App Scaffold
    { benchmarkId: bmMap["greenfield-app-scaffold-2026"], toolId: toolMap["claude-code"], results: { "Features Complete": 95, "Runs First Try": 1, "Test Coverage": 82, "Code Quality": 9.0 }, runDate: new Date("2026-02-17"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["greenfield-app-scaffold-2026"], toolId: toolMap["cursor"], results: { "Features Complete": 88, "Runs First Try": 1, "Test Coverage": 72, "Code Quality": 8.5 }, runDate: new Date("2026-02-17"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["greenfield-app-scaffold-2026"], toolId: toolMap["replit-agent"], results: { "Features Complete": 85, "Runs First Try": 1, "Test Coverage": 55, "Code Quality": 7.2 }, runDate: new Date("2026-02-17"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["greenfield-app-scaffold-2026"], toolId: toolMap["devin"], results: { "Features Complete": 90, "Runs First Try": 0, "Test Coverage": 68, "Code Quality": 8.0 }, runDate: new Date("2026-02-17"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["greenfield-app-scaffold-2026"], toolId: toolMap["github-copilot"], results: { "Features Complete": 75, "Runs First Try": 0, "Test Coverage": 60, "Code Quality": 7.8 }, runDate: new Date("2026-02-17"), runBy: "StackQuadrant Team" },

    // Context Window Stress Test
    { benchmarkId: bmMap["context-window-stress-test-2026"], toolId: toolMap["claude-code"], results: { "Changes Correct": 5, "Broken Imports": 0, "Compiles Clean": 1, "Time": 6.5 }, runDate: new Date("2026-02-18"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["context-window-stress-test-2026"], toolId: toolMap["sourcegraph-cody"], results: { "Changes Correct": 4, "Broken Imports": 1, "Compiles Clean": 0, "Time": 9.0 }, runDate: new Date("2026-02-18"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["context-window-stress-test-2026"], toolId: toolMap["cursor"], results: { "Changes Correct": 4, "Broken Imports": 1, "Compiles Clean": 1, "Time": 8.0 }, runDate: new Date("2026-02-18"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["context-window-stress-test-2026"], toolId: toolMap["aider"], results: { "Changes Correct": 3, "Broken Imports": 2, "Compiles Clean": 0, "Time": 7.5 }, runDate: new Date("2026-02-18"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["context-window-stress-test-2026"], toolId: toolMap["augment-code"], results: { "Changes Correct": 4, "Broken Imports": 1, "Compiles Clean": 0, "Time": 10.0 }, runDate: new Date("2026-02-18"), runBy: "StackQuadrant Team" },

    // Test Generation Quality
    { benchmarkId: bmMap["test-generation-quality-2026"], toolId: toolMap["codium-qodo"], results: { "Edge Cases": 88, "Mutation Score": 82, "Readability": 8.5, "False Passes": 1 }, runDate: new Date("2026-02-19"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["test-generation-quality-2026"], toolId: toolMap["claude-code"], results: { "Edge Cases": 85, "Mutation Score": 78, "Readability": 9.0, "False Passes": 0 }, runDate: new Date("2026-02-19"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["test-generation-quality-2026"], toolId: toolMap["cursor"], results: { "Edge Cases": 75, "Mutation Score": 70, "Readability": 8.2, "False Passes": 2 }, runDate: new Date("2026-02-19"), runBy: "StackQuadrant Team" },
    { benchmarkId: bmMap["test-generation-quality-2026"], toolId: toolMap["github-copilot"], results: { "Edge Cases": 72, "Mutation Score": 65, "Readability": 7.8, "False Passes": 3 }, runDate: new Date("2026-02-19"), runBy: "StackQuadrant Team" },
  ];

  await db.insert(benchmarkResults).values(benchResultData);
  console.log(`  Inserted ${benchResultData.length} benchmark results`);

  // 6. Stacks
  const stackData = [
    {
      name: "The Autonomous Stack",
      slug: "the-autonomous-stack",
      description: "A fully autonomous development workflow where Claude Code handles implementation while Cursor provides rapid iteration and visual feedback. Best for experienced developers who want maximum speed on greenfield projects.",
      useCase: "Greenfield Full-Stack Development",
      projectOutcome: "Built a complete SaaS application (Next.js + PostgreSQL) in 3 days with 92% test coverage. Claude Code handled backend, database, and complex logic autonomously. Cursor was used for UI polish and rapid visual iteration. Minimal manual coding required.",
      overallScore: "9.1",
      metrics: { developerProductivity: 95, codeQuality: 90, testCoverage: 92, setupComplexity: 30, learningCurve: 40, costEfficiency: 70 },
      status: "published",
      publishedAt: new Date(),
    },
    {
      name: "The Enterprise Safe Stack",
      slug: "the-enterprise-safe-stack",
      description: "A compliance-friendly stack combining GitHub Copilot's enterprise features with Amazon Q's AWS integration and Sourcegraph Cody's code graph for large monorepos.",
      useCase: "Enterprise Cloud Applications",
      projectOutcome: "Migrated a 200K-line Java monolith to microservices on AWS. Copilot handled routine coding, Amazon Q managed AWS infrastructure and security scanning, and Cody provided monorepo navigation. SOC 2 compliant throughout.",
      overallScore: "8.2",
      metrics: { developerProductivity: 80, codeQuality: 85, testCoverage: 78, setupComplexity: 60, learningCurve: 55, costEfficiency: 65 },
      status: "published",
      publishedAt: new Date(),
    },
    {
      name: "The Open Source Stack",
      slug: "the-open-source-stack",
      description: "A fully open-source AI development stack using Aider for terminal-based coding, Continue for IDE assistance, and Qodo for test generation. Zero vendor lock-in.",
      useCase: "Open Source Development",
      projectOutcome: "Maintained a popular open-source library with 50+ contributors. Aider handled feature branches and refactoring. Continue provided IDE support for contributors. Qodo ensured test coverage stayed above 85%. All running on self-hosted models.",
      overallScore: "7.8",
      metrics: { developerProductivity: 75, codeQuality: 82, testCoverage: 85, setupComplexity: 45, learningCurve: 50, costEfficiency: 95 },
      status: "published",
      publishedAt: new Date(),
    },
  ];

  const insertedStacks = await db.insert(stacks).values(stackData).returning();
  console.log(`  Inserted ${insertedStacks.length} stacks`);

  const stackMap = Object.fromEntries(insertedStacks.map((s) => [s.slug, s.id]));

  // Stack tools
  const stackToolData = [
    // The Autonomous Stack
    { stackId: stackMap["the-autonomous-stack"], toolId: toolMap["claude-code"], role: "Primary coding agent — handles backend, database, testing, and complex logic" },
    { stackId: stackMap["the-autonomous-stack"], toolId: toolMap["cursor"], role: "UI development and rapid visual iteration" },
    { stackId: stackMap["the-autonomous-stack"], toolId: toolMap["codium-qodo"], role: "Test generation and code quality validation" },

    // The Enterprise Safe Stack
    { stackId: stackMap["the-enterprise-safe-stack"], toolId: toolMap["github-copilot"], role: "Primary coding assistant — inline completions and chat" },
    { stackId: stackMap["the-enterprise-safe-stack"], toolId: toolMap["amazon-q-developer"], role: "AWS infrastructure, security scanning, code transformation" },
    { stackId: stackMap["the-enterprise-safe-stack"], toolId: toolMap["sourcegraph-cody"], role: "Large codebase navigation and cross-repo search" },

    // The Open Source Stack
    { stackId: stackMap["the-open-source-stack"], toolId: toolMap["aider"], role: "Terminal-based coding and multi-file refactoring" },
    { stackId: stackMap["the-open-source-stack"], toolId: toolMap["continue-dev"], role: "IDE integration with self-hosted models" },
    { stackId: stackMap["the-open-source-stack"], toolId: toolMap["codium-qodo"], role: "Automated test generation for contribution quality" },
  ];

  await db.insert(stackTools).values(stackToolData);
  console.log(`  Inserted ${stackToolData.length} stack tool associations`);

  // 7. Admin user
  const passwordHash = await hash("admin123!", 12);
  await db.insert(adminUsers).values({
    email: "admin@stackquadrant.dev",
    passwordHash,
    name: "Admin",
    role: "admin",
  });
  console.log("  Inserted admin user (admin@stackquadrant.dev / admin123!)");

  console.log("\nSeed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
