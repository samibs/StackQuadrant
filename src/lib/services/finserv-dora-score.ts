export const SCORING_MODEL_VERSION = "sq-dora-v1";
export const DECAY_HORIZON_DAYS = 730;
export const DECAY_FLOOR = 0.25;
export const NORMALISATION_CAP = 100;
export const MAX_SCORE = 100;

export interface ScorableDoraIncident {
  categoryId: string;
  severity: number;
  occurredAt: Date;
}

export interface DoraRiskCalculation {
  riskScore: number;
  incidentCount: number;
  categoryBreakdown: Record<string, { count: number; weightedScore: number }>;
}

export function ageDecay(occurredAt: Date, now: Date): number {
  const ageDays = (now.getTime() - occurredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 0) return 1;
  if (ageDays >= DECAY_HORIZON_DAYS) return DECAY_FLOOR;
  const progress = ageDays / DECAY_HORIZON_DAYS;
  return 1 - progress * (1 - DECAY_FLOOR);
}

export function calculateVendorRiskScore(
  incidents: ScorableDoraIncident[],
  categoryWeights: ReadonlyMap<string, number>,
  now: Date = new Date()
): DoraRiskCalculation {
  const categoryBreakdown: Record<string, { count: number; weightedScore: number }> = {};
  let totalWeighted = 0;

  for (const incident of incidents) {
    const categoryWeight = categoryWeights.get(incident.categoryId) ?? 0.5;
    const weighted = incident.severity * categoryWeight * ageDecay(incident.occurredAt, now);
    totalWeighted += weighted;

    const entry = categoryBreakdown[incident.categoryId] ?? { count: 0, weightedScore: 0 };
    entry.count += 1;
    entry.weightedScore += weighted;
    categoryBreakdown[incident.categoryId] = entry;
  }

  const rawScore = (totalWeighted / NORMALISATION_CAP) * MAX_SCORE;
  const riskScore = Math.min(MAX_SCORE, Math.max(0, Math.round(rawScore * 100) / 100));

  return {
    riskScore,
    incidentCount: incidents.length,
    categoryBreakdown,
  };
}
