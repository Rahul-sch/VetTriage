import { useState, useRef, useCallback, useEffect } from "react";
import {
  isSpeechRecognitionSupported,
  getSpeechRecognition,
} from "../utils/browserSupport";

export type SpeechError =
  | "not-supported"
  | "permission-denied"
  | "no-speech"
  | "network"
  | "unknown";

interface UseSpeechRecognitionReturn {
  /** Whether Web Speech API is supported */
  isSupported: boolean;
  /** Whether currently listening */
  isListening: boolean;
  /** Final confirmed transcript */
  transcript: string;
  /** Interim (in-progress) transcript */
  interimTranscript: string;
  /** Current error state */
  error: SpeechError | null;
  /** Start listening */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Clear transcript and errors */
  reset: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isSupported] = useState(() => isSpeechRecognitionSupported());
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<SpeechError | null>(
    isSupported ? null : "not-supported"
  );

  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript("");

      switch (event.error) {
        case "not-allowed":
          setError("permission-denied");
          break;
        case "no-speech":
          setError("no-speech");
          break;
        case "network":
          setError("network");
          break;
        default:
          setError("unknown");
      }
    };

    recognition.onresult = (event) => {
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

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
      setInterimTranscript(currentInterim);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setError(null);
    try {
      recognitionRef.current.start();
    } catch {
      // Already started, ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      // Already stopped, ignore
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(isSupported ? null : "not-supported");
  }, [isSupported]);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    reset,
  };
}
