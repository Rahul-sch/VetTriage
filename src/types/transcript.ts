export type Speaker = "vet" | "owner";

export interface TranscriptSegment {
  speaker: Speaker;
  text: string;
  timestamp: number;
}

export interface DiarizedTranscript {
  segments: TranscriptSegment[];
  currentSpeaker: Speaker;
}

/**
 * Format diarized transcript for display
 */
export function formatTranscriptForDisplay(segments: TranscriptSegment[]): string {
  return segments
    .map((seg) => `[${seg.speaker === "vet" ? "Vet" : "Owner"}]: ${seg.text}`)
    .join("\n");
}

/**
 * Format diarized transcript for AI analysis
 */
export function formatTranscriptForAnalysis(segments: TranscriptSegment[]): string {
  return segments
    .map((seg) => `${seg.speaker === "vet" ? "VET" : "OWNER"}: ${seg.text}`)
    .join("\n");
}

/**
 * Get plain text without speaker labels
 */
export function getPlainTranscript(segments: TranscriptSegment[]): string {
  return segments.map((seg) => seg.text).join(" ");
}

