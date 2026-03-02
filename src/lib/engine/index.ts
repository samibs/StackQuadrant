// ============================================
// Core Quadrant Engine — Public API
// ============================================

// Types
export type {
  DomainConfig,
  DimensionConfig,
  QuadrantConfig,
  EntityConfig,
  EntityFieldConfig,
  NavConfig,
  NavItemConfig,
  SourceAdapterConfig,
  SourceAdapter,
  RawSignal,
  NormalizedSignal,
  ScoringInput,
  ScoringResult,
  QuadrantEntity,
  DomainSummary,
  EntityDetail,
  ScoreHistoryEntry,
  AdapterRunStatus,
} from "./types";

// Domain Registry
export {
  registerDomain,
  getDomain,
  getDomainBySlug,
  listDomains,
  getDomainDimensions,
  setDomainActive,
} from "./domain-registry";

// Scoring Engine
export {
  scoreEntity,
  recomputeDomainScores,
  getEntityScoreHistory,
  getEntityDimensionScores,
} from "./scoring-engine";

// Entity Manager
export {
  createEntity,
  getEntity,
  getEntityBySlug,
  listEntities,
  updateEntity,
  deleteEntity,
  getQuadrantEntities,
  getEntityCountsByType,
} from "./entity-manager";

// Adapter Pipeline
export {
  runAdapter,
  runAdapters,
} from "./adapter-pipeline";
