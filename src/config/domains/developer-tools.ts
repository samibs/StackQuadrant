// ============================================
// Domain Configuration: Developer Tools
// Maps existing StackQuadrant tool evaluations to the Core Engine
// ============================================

import type { DomainConfig } from "@/lib/engine/types";

export const developerToolsDomain: DomainConfig = {
  id: "developer-tools",
  name: "AI Developer Tools",
  slug: "tools",
  description: "Evaluations and rankings of AI-powered developer tools across multiple capability dimensions.",

  entities: [
    {
      type: "tool",
      name: "AI Tool",
      pluralName: "AI Tools",
      icon: "code",
      fields: [
        { key: "vendor", label: "Vendor", type: "string", required: false },
        { key: "category", label: "Category", type: "string", required: true },
        { key: "pricingModel", label: "Pricing Model", type: "string", required: false },
        { key: "websiteUrl", label: "Website URL", type: "url", required: false },
        { key: "githubUrl", label: "GitHub URL", type: "url", required: false },
        { key: "githubStars", label: "GitHub Stars", type: "number", required: false },
      ],
    },
    {
      type: "repository",
      name: "Repository",
      pluralName: "Repositories",
      icon: "git-branch",
      fields: [
        { key: "githubOwner", label: "GitHub Owner", type: "string", required: true },
        { key: "githubRepo", label: "GitHub Repo", type: "string", required: true },
        { key: "language", label: "Language", type: "string", required: false },
        { key: "license", label: "License", type: "string", required: false },
      ],
    },
  ],

  scoringDimensions: [
    {
      id: "code-generation",
      name: "Code Generation",
      description: "Quality and capabilities of AI code generation",
      weight: 0.20,
      scale: { min: 0, max: 10 },
      displayOrder: 1,
    },
    {
      id: "context-awareness",
      name: "Context Awareness",
      description: "Ability to understand and use project context",
      weight: 0.18,
      scale: { min: 0, max: 10 },
      displayOrder: 2,
    },
    {
      id: "developer-experience",
      name: "Developer Experience",
      description: "Ease of use, integration, and overall developer workflow",
      weight: 0.18,
      scale: { min: 0, max: 10 },
      displayOrder: 3,
    },
    {
      id: "multi-file-editing",
      name: "Multi-file Editing",
      description: "Capabilities for editing across multiple files simultaneously",
      weight: 0.15,
      scale: { min: 0, max: 10 },
      displayOrder: 4,
    },
    {
      id: "debugging",
      name: "Debugging",
      description: "AI-assisted debugging and error resolution capabilities",
      weight: 0.15,
      scale: { min: 0, max: 10 },
      displayOrder: 5,
    },
    {
      id: "ecosystem",
      name: "Ecosystem",
      description: "Plugin ecosystem, integrations, and community support",
      weight: 0.14,
      scale: { min: 0, max: 10 },
      displayOrder: 6,
    },
  ],

  quadrantConfig: {
    xAxis: {
      id: "context-awareness",
      label: "Innovation",
      description: "Context awareness, multi-file capabilities, and advanced features",
    },
    yAxis: {
      id: "developer-experience",
      label: "Execution",
      description: "Developer experience, code quality, and reliability",
    },
    quadrants: {
      topRight: { label: "Leaders", description: "High innovation and high execution" },
      topLeft: { label: "Challengers", description: "High execution, lower innovation" },
      bottomRight: { label: "Visionaries", description: "High innovation, lower execution" },
      bottomLeft: { label: "Niche Players", description: "Focused on specific use cases" },
    },
  },

  sourceAdapters: ["github"],

  navigation: {
    label: "Tools",
    icon: "code",
    position: 1,
    children: [
      { label: "All Tools", href: "/tools", icon: "list" },
      { label: "Magic Quadrant", href: "/matrix", icon: "grid" },
      { label: "Benchmarks", href: "/benchmarks", icon: "bar-chart" },
      { label: "Stacks", href: "/stacks", icon: "layers" },
      { label: "Repositories", href: "/repos", icon: "git-branch" },
    ],
  },
};
