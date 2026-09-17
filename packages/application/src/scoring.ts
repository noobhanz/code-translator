export const HUMAN_CONFIDENCE_THRESHOLD = 0.55;

export function clampConfidence(value: number): number {
  const bounded = Math.min(1, Math.max(0, value));
  return Math.round(bounded * 100) / 100;
}

export function confidenceBand(value: number): "high" | "medium" | "low" {
  if (value >= 0.85) {
    return "high";
  }
  if (value >= 0.6) {
    return "medium";
  }
  return "low";
}

export function visibleToHumans(value: number): boolean {
  return value >= HUMAN_CONFIDENCE_THRESHOLD;
}
