// ============================================
// Core Quadrant Engine — Type Definitions
// Domain-agnostic platform types for multi-vertical scoring
// ============================================

/**
 * Configuration for a domain vertical registered with the engine.
 * Each vertical (developer-tools, market-signals, financial-services)
 * provides one of these to register with the platform.
 */
export interface DomainConfig {
  id: string;                         // e.g., "developer-tools", "market-signals"
  name: string;                       // Display name
  slug: string;                       // URL prefix: /tools, /opportunities, /intelligence
  description: string;

  entities: EntityConfig[];            // Entity types in this domain
  scoringDimensions: DimensionConfig[];// Scoring axes
  quadrantConfig: QuadrantConfig;      // Axis labels and quadrant names
  sourceAdapters: string[];            // Registered adapter IDs
  navigation: NavConfig;               // Menu items and routing
}

export interface EntityConfig {
  type: string;                        // e.g., "tool", "pain_point", "vendor"
  name: string;                        // Display name
  pluralName: string;                  // Display name (plural)
  icon?: string;                       // Optional icon identifier
  fields: EntityFieldConfig[];         // Domain-specific metadata fields
}

export interface EntityFieldConfig {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "url" | "json" | "date";
  required: boolean;
}

export interface DimensionConfig {
  id: string;
  name: string;
  description: string;
  weight: number;                      // 0-1, all weights must sum to 1
  scale: { min: number; max: number };
  displayOrder: number;
}

export interface QuadrantConfig {
  xAxis: { id: string; label: string; description: string };
  yAxis: { id: string; label: string; description: string };
  quadrants: {
    topRight: { label: string; description: string };
    topLeft: { label: string; description: string };
    bottomRight: { label: string; description: string };
    bottomLeft: { label: string; description: string };
  };
}

export interface NavConfig {
  label: string;                       // Nav menu label
  icon?: string;                       // Nav icon
  position: number;                    // Display order in nav
  children?: NavItemConfig[];          // Sub-navigation items
}

export interface NavItemConfig {
  label: string;
  href: string;
  icon?: string;
}

// ============================================
// Source Adapter Interface
// ============================================

export interface SourceAdapterConfig {
  id: string;
  name: string;
  domainId: string;
  schedule: string;                    // Cron expression
  rateLimits: { requests: number; perSeconds: number };
  enabled: boolean;
}

export interface RawSignal {
  sourceId: string;
  sourceType: string;                  // "reddit", "appstore", "github", etc.
  content: string;
  url: string;
  author?: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface NormalizedSignal {
  sourceId: string;
  sourceType: string;
  content: string;
  url: string;
  author?: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

/**
 * Interface that all source adapters must implement.
 * Each adapter fetches from one external source and normalizes data.
 */
export interface SourceAdapter {
  readonly config: SourceAdapterConfig;

  fetch(): Promise<RawSignal[]>;
  normalize(raw: RawSignal[]): Promise<NormalizedSignal[]>;
  healthCheck(): Promise<boolean>;
}

// ============================================
// Scoring Engine Types
// ============================================

export interface ScoringInput {
  entityId: string;
  scores: { dimensionId: string; score: number }[];
}

export interface ScoringResult {
  entityId: string;
  compositeScore: number;
  quadrantX: number;
  quadrantY: number;
  dimensionScores: { dimensionId: string; score: number; weightedScore: number }[];
}

// ============================================
// Quadrant Entity (for visualization)
// ============================================

export interface QuadrantEntity {
  id: string;
  label: string;
  x: number;                           // 0-100
  y: number;                           // 0-100
  colorValue?: number;                 // For color mapping
  sizeValue?: number;                  // For size mapping
  metadata?: Record<string, unknown>;
}

// ============================================
// API Response Types
// ============================================

export interface DomainSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  entityCount: number;
  isActive: boolean;
}

export interface EntityDetail {
  id: string;
  domainId: string;
  entityType: string;
  name: string;
  slug: string;
  compositeScore: number | null;
  quadrantX: number | null;
  quadrantY: number | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  dimensionScores: { dimensionId: string; dimensionName: string; score: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoreHistoryEntry {
  compositeScore: number;
  dimensionScores: Record<string, number>;
  recordedAt: Date;
}

export interface AdapterRunStatus {
  adapterId: string;
  domainId: string;
  status: "queued" | "running" | "completed" | "failed";
  signalsFetched: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
}
