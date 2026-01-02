import { useState, useRef, useCallback, useEffect } from "react";
import {
  isSpeechRecognitionSupported,
  getSpeechRecognition,
} from "../utils/browserSupport";
import type { Speaker, TranscriptSegment } from "../types/transcript";

export type SpeechError =
  | "not-supported"
  | "permission-denied"
  | "network"
  | "unknown";

// Pause duration (ms) that triggers speaker change
const SPEAKER_CHANGE_THRESHOLD = 1500;

interface UseSpeechRecognitionReturn {
  /** Whether Web Speech API is supported */
  isSupported: boolean;
  /** Whether currently listening */
  isListening: boolean;
  /** Diarized transcript segments */
  segments: TranscriptSegment[];
  /** Current speaker */
  currentSpeaker: Speaker;
  /** Interim (in-progress) transcript */
  interimTranscript: string;
  /** Current error state */
  error: SpeechError | null;
  /** Start listening */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Manually toggle speaker */
  toggleSpeaker: () => void;
  /** Clear transcript and errors */
  reset: () => void;
  /** Set segments directly (for session restore) */
  setSegments: (segments: TranscriptSegment[]) => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isSupported] = useState(() => isSpeechRecognitionSupported());
  const [isListening, setIsListening] = useState(false);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>("owner");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<SpeechError | null>(
    isSupported ? null : "not-supported"
  );

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const shouldRestartRef = useRef<boolean>(false);
  const currentSpeakerRef = useRef<Speaker>("owner");

  // Keep ref in sync with state
  useEffect(() => {
    currentSpeakerRef.current = currentSpeaker;
  }, [currentSpeaker]);

  // Initialize recognition instance
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();

    // Configure for continuous recognition with interim results
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      lastSpeechTimeRef.current = Date.now();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");

      // Auto-restart if we should still be listening
      if (shouldRestartRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // Ignore if already started
          }
        }, 100);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Handle no-speech gracefully - just restart if we should be recording
      if (event.error === "no-speech") {
        // Don't set error, just let it restart via onend
        return;
      }

      // Handle aborted gracefully (happens when stopping)
      if (event.error === "aborted") {
        return;
      }

      setIsListening(false);
      setInterimTranscript("");

      switch (event.error) {
        case "not-allowed":
          setError("permission-denied");
          shouldRestartRef.current = false;
          break;
        case "network":
          setError("network");
          break;
        default:
          setError("unknown");
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const now = Date.now();
      const timeSinceLastSpeech = now - lastSpeechTimeRef.current;

      let finalTranscript = "";
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result) {
          const transcriptText = result[0]?.transcript || "";
          if (result.isFinal) {
            finalTranscript += transcriptText;
          } else {
            currentInterim += transcriptText;
          }
        }
      }

      // Update interim display
      setInterimTranscript(currentInterim);

      if (finalTranscript) {
        // Check if we should switch speakers based on pause
        const shouldSwitchSpeaker =
          timeSinceLastSpeech > SPEAKER_CHANGE_THRESHOLD;

        const speaker = shouldSwitchSpeaker
          ? currentSpeakerRef.current === "vet"
            ? "owner"
            : "vet"
          : currentSpeakerRef.current;

        if (shouldSwitchSpeaker) {
          setCurrentSpeaker(speaker);
        }

        // Add segment with correct speaker
        setSegments((prev) => {
          const lastSegment = prev[prev.length - 1];

          // If same speaker and recent, append to last segment
          if (
            lastSegment &&
            lastSegment.speaker === speaker &&
            !shouldSwitchSpeaker
          ) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastSegment,
                text: lastSegment.text + " " + finalTranscript.trim(),
              },
            ];
          } else {
            // New segment
            return [
              ...prev,
              {
                speaker,
                text: finalTranscript.trim(),
                timestamp: now,
              },
            ];
          }
        });

        lastSpeechTimeRef.current = now;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setError(null);
    shouldRestartRef.current = true;
    lastSpeechTimeRef.current = Date.now();
    try {
      recognitionRef.current.start();
    } catch {
      // Already started, ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      // Already stopped, ignore
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setCurrentSpeaker((prev) => (prev === "vet" ? "owner" : "vet"));
  }, []);

  const reset = useCallback(() => {
    setSegments([]);
    setCurrentSpeaker("owner");
    setInterimTranscript("");
    setError(isSupported ? null : "not-supported");
    shouldRestartRef.current = false;
  }, [isSupported]);

  return {
    isSupported,
    isListening,
    segments,
    currentSpeaker,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleSpeaker,
    reset,
    setSegments,
  };
}
