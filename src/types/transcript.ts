export type Speaker = "vet" | "owner";

export interface TranscriptSegment {
  speaker: Speaker;
  text: string;
  /** Absolute timestamp when segment was created */
  timestamp: number;
  /** Relative time in seconds from recording start */
  relativeTime?: number;
}

export interface DiarizedTranscript {
  segments: TranscriptSegment[];
  currentSpeaker: Speaker;
}

/**
 * Format diarized transcript for display
 */
export function formatTranscriptForDisplay(
  segments: TranscriptSegment[]
): string {
  return segments
    .map((seg) => `[${seg.speaker === "vet" ? "Vet" : "Owner"}]: ${seg.text}`)
    .join("\n");
}

/**
 * Format diarized transcript for AI analysis
 */
export function formatTranscriptForAnalysis(
  segments: TranscriptSegment[]
): string {
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

/**
 * Calculate relative times for segments based on recording start time
 */
export function calculateRelativeTimes(
  segments: TranscriptSegment[],
  recordingStartTime: number
): TranscriptSegment[] {
  return segments.map((seg) => ({
    ...seg,
    relativeTime: (seg.timestamp - recordingStartTime) / 1000,
  }));
}

/**
 * Find the active segment based on current playback time
 */
export function findActiveSegment(
  segments: TranscriptSegment[],
  currentTime: number
): number {
  // Find the last segment that started before or at currentTime
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg?.relativeTime !== undefined && seg.relativeTime <= currentTime) {
      return i;
    }
  }
  return -1;
}
