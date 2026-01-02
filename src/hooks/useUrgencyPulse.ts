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
  const isAnalyzingRef = useRef<boolean>(false); // Prevent concurrent calls

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
    if (isAnalyzingRef.current) return;
    
    // Minimum 5 seconds between calls to avoid rate limits
    const timeSinceLastCall = Date.now() - lastAnalysisTimeRef.current;
    if (timeSinceLastCall < 5000) return;

    isAnalyzingRef.current = true;
    try {
      const assessment = await detectUrgency(transcript);
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
    }
  }, []);

  // Periodic analysis during recording
  useEffect(() => {
    if (!isRecording) {
      // Clear interval when not recording
      if (analysisIntervalRef.current !== null) {
        window.clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      return;
    }

    // Analyze immediately if we have segments
    if (segments.length > 0) {
      const transcript = formatTranscript(segments);
      if (transcript.trim()) {
        analyzeUrgency(transcript);
        lastAnalysisTimeRef.current = Date.now();
      }
    }

      // Set up periodic analysis every 6 seconds (reduced frequency to avoid rate limits)
      analysisIntervalRef.current = window.setInterval(() => {
        const transcript = formatTranscript(segments);
        if (transcript.trim()) {
          analyzeUrgency(transcript);
        }
      }, 6000); // 6 seconds - less frequent to avoid rate limits

    return () => {
      if (analysisIntervalRef.current !== null) {
        window.clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [isRecording, segments, formatTranscript, analyzeUrgency]);

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

