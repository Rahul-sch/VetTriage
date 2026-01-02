/**
 * Urgency levels for real-time pulse indicator
 */
export type UrgencyLevel = "routine" | "monitor" | "urgent" | "emergency";

/**
 * Urgency score (1-5)
 */
export type UrgencyScore = 1 | 2 | 3 | 4 | 5;

/**
 * Real-time urgency assessment result
 */
export interface UrgencyAssessment {
  urgency: UrgencyScore;
  level: UrgencyLevel;
  reason: string;
  alert?: string;
}

/**
 * Map urgency score to level
 */
export function scoreToLevel(score: UrgencyScore): UrgencyLevel {
  if (score <= 2) return "routine";
  if (score === 3) return "monitor";
  if (score === 4) return "urgent";
  return "emergency";
}

/**
 * Compare urgency levels (higher = more urgent)
 */
export function compareUrgency(
  a: UrgencyScore,
  b: UrgencyScore
): number {
  return b - a; // Higher score = more urgent
}

