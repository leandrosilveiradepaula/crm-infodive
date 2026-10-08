export type DealDiagnosis = {
  status: 'healthy' | 'at_risk' | 'urgent';
  healthScore: number;
  trend: 'stable' | 'improving' | 'declining';
  riskFactors: string[];
  insights: string[];
  recommendations: string[];
  nextSteps: string[];
};

const statuses = new Set(['healthy', 'at_risk', 'urgent']);
const trends = new Set(['stable', 'improving', 'declining']);

function isShortTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 3 &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 1000);
}

export function parseDealDiagnosis(value: unknown): DealDiagnosis | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const d = value as Record<string, unknown>;
  if (typeof d.status !== 'string' || !statuses.has(d.status)) return null;
  if (typeof d.trend !== 'string' || !trends.has(d.trend)) return null;
  if (typeof d.healthScore !== 'number' || !Number.isInteger(d.healthScore) || d.healthScore < 1 || d.healthScore > 100) return null;
  if (!isShortTextList(d.riskFactors) || !isShortTextList(d.insights) ||
      !isShortTextList(d.recommendations) || !isShortTextList(d.nextSteps)) return null;
  return {
    status: d.status as DealDiagnosis['status'],
    healthScore: d.healthScore,
    trend: d.trend as DealDiagnosis['trend'],
    riskFactors: d.riskFactors,
    insights: d.insights,
    recommendations: d.recommendations,
    nextSteps: d.nextSteps,
  };
}
