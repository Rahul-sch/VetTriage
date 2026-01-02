import { useState, useCallback } from "react";

export type RecordingState = "idle" | "recording" | "processing" | "complete";

interface UseRecordingStateReturn {
  state: RecordingState;
  isIdle: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isComplete: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  startProcessing: () => void;
  completeProcessing: () => void;
  reset: () => void;
}

export function useRecordingState(): UseRecordingStateReturn {
  const [state, setState] = useState<RecordingState>("idle");

  const startRecording = useCallback(() => {
    if (state === "idle" || state === "complete") {
      setState("recording");
    }
  }, [state]);

  const stopRecording = useCallback(() => {
    if (state === "recording") {
      setState("processing");
    }
  }, [state]);

  const startProcessing = useCallback(() => {
    setState("processing");
  }, []);

  const completeProcessing = useCallback(() => {
    setState("complete");
  }, []);

  const reset = useCallback(() => {
    setState("idle");
  }, []);

  return {
    state,
    isIdle: state === "idle",
    isRecording: state === "recording",
    isProcessing: state === "processing",
    isComplete: state === "complete",
    startRecording,
    stopRecording,
    startProcessing,
    completeProcessing,
    reset,
  };
}
