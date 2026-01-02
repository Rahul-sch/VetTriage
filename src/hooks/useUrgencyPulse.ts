import { useState, useEffect, useRef, useCallback } from "react";
import type { TranscriptSegment } from "../types/transcript";
import type { UrgencyAssessment, UrgencyScore } from "../types/urgency";
import { detectUrgency } from "../services/urgencyDetection";
import { compareUrgency } from "../types/urgency";

interface UseUrgencyPulseReturn {
  /** Current urgency assessment */
  urgency: UrgencyAssessment | null;
  /** Whether urgency just escalated (for animation trigger) */
  justEscalated: boolean;
  /** Reset escalation flag */
  resetEscalation: () => void;
}

/**
 * Hook for real-time urgency pulse during recording
 * Analyzes transcript chunks every 3-5 seconds
 * Urgency can only escalate, never downgrade
 */
export function useUrgencyPulse(
  segments: TranscriptSegment[],
  isRecording: boolean
): UseUrgencyPulseReturn {
  const [urgency, setUrgency] = useState<UrgencyAssessment | null>(null);
  const [justEscalated, setJustEscalated] = useState(false);
  const highestUrgencyRef = useRef<UrgencyScore>(1);
  const lastAnalysisTimeRef = useRef<number>(0);
  const analysisIntervalRef = useRef<number | null>(null);
  const isAnalyzingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Use ref to access current segments without triggering effect re-runs
  const segmentsRef = useRef<TranscriptSegment[]>(segments);

  // Keep ref in sync with segments
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  // Format segments into transcript text
  const formatTranscript = useCallback((segments: TranscriptSegment[]): string => {
    return segments
      .map((seg) => `${seg.speaker.toUpperCase()}: ${seg.text}`)
      .join("\n");
  }, []);

  // Analyze urgency from current transcript
  const analyzeUrgency = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    // Prevent concurrent calls
    if (isAnalyzingRef.current) {
      return;
    }

    // Minimum 5 seconds between calls to avoid rate limits
    const timeSinceLastCall = Date.now() - lastAnalysisTimeRef.current;
    if (timeSinceLastCall < 5000) {
      return;
    }

    isAnalyzingRef.current = true;

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const assessment = await detectUrgency(transcript, abortControllerRef.current.signal);
      if (assessment) {
        setUrgency((prev) => {
          // Only escalate, never downgrade
          if (!prev || compareUrgency(assessment.urgency, prev.urgency) > 0) {
            // Urgency increased
            if (prev && assessment.urgency > prev.urgency) {
              setJustEscalated(true);
            }
            highestUrgencyRef.current = Math.max(
              highestUrgencyRef.current,
              assessment.urgency
            ) as UrgencyScore;
            return assessment;
          }
          // Keep previous urgency if new one is lower
          return prev;
        });
        lastAnalysisTimeRef.current = Date.now();
      }
    } finally {
      isAnalyzingRef.current = false;
      abortControllerRef.current = null;
    }
  }, []);

  // Periodic analysis during recording
  useEffect(() => {
    if (!isRecording) {
      // Abort any in-flight request first
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // Clear interval when not recording
      if (analysisIntervalRef.current !== null) {
        window.clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      return;
    }

    // Set up periodic analysis every 6 seconds
    // Uses segmentsRef to avoid recreating interval on every segment change
    analysisIntervalRef.current = window.setInterval(() => {
      const transcript = formatTranscript(segmentsRef.current);
      if (transcript.trim()) {
        analyzeUrgency(transcript);
      }
    }, 6000);

    return () => {
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (analysisIntervalRef.current !== null) {
        window.clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [isRecording, formatTranscript, analyzeUrgency]);

  // Reset urgency when recording stops
  useEffect(() => {
    if (!isRecording) {
      setUrgency(null);
      highestUrgencyRef.current = 1;
      setJustEscalated(false);
    }
  }, [isRecording]);

  const resetEscalation = useCallback(() => {
    setJustEscalated(false);
  }, []);

  return {
    urgency,
    justEscalated,
    resetEscalation,
  };
}

