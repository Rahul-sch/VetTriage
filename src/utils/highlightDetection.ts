/**
 * Detect if text contains diagnosis/assessment language
 */
export function isDiagnosisStatement(text: string): boolean {
  const lowerText = text.toLowerCase();
  const diagnosisPatterns = [
    "diagnos",
    "assessment",
    "appears to be",
    "looks like",
    "seems like",
    "condition is",
    "suspect",
    "indicating",
    "consistent with",
    "likely",
    "probably",
    "signs of",
    "symptoms suggest",
    "presenting with",
    "suffering from",
    "affected by",
  ];

  return diagnosisPatterns.some((pattern) => lowerText.includes(pattern));
}

/**
 * Detect if text contains recommendation/next-steps language
 */
export function isRecommendationStatement(text: string): boolean {
  const lowerText = text.toLowerCase();
  const recommendationPatterns = [
    "recommend",
    "suggest",
    "should",
    "need to",
    "prescrib",
    "follow up",
    "follow-up",
    "come back",
    "bring him",
    "bring her",
    "bring them",
    "schedule",
    "monitor",
    "keep an eye",
    "make sure",
    "important to",
    "advise",
    "treatment",
    "medication",
    "give him",
    "give her",
    "administer",
  ];

  return recommendationPatterns.some((pattern) => lowerText.includes(pattern));
}

export type HighlightType = "diagnosis" | "recommendation" | null;

/**
 * Determine the highlight type for a text segment
 */
export function getHighlightType(text: string): HighlightType {
  if (isDiagnosisStatement(text)) return "diagnosis";
  if (isRecommendationStatement(text)) return "recommendation";
  return null;
}

