import { useState, useCallback } from "react";

export type RecordingState = "idle" | "recording" | "processing";

interface UseRecordingStateReturn {
  state: RecordingState;
  isIdle: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
}

export function useRecordingState(): UseRecordingStateReturn {
  const [state, setState] = useState<RecordingState>("idle");

  const startRecording = useCallback(() => {
    if (state === "idle") {
      setState("recording");
    }
  }, [state]);

  const stopRecording = useCallback(() => {
    if (state === "recording") {
      setState("processing");
      // In Phase 3+, this will trigger AI analysis
      // For now, simulate processing then return to idle after 2s
      setTimeout(() => setState("idle"), 2000);
    }
  }, [state]);

  const reset = useCallback(() => {
    setState("idle");
  }, []);

  return {
    state,
    isIdle: state === "idle",
    isRecording: state === "recording",
    isProcessing: state === "processing",
    startRecording,
    stopRecording,
    reset,
  };
}
