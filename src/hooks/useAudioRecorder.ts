import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderReturn {
  /** Whether recording is in progress */
  isRecording: boolean;
  /** Recorded audio blob URL (available after stop) */
  audioUrl: string | null;
  /** Recorded audio blob (for persistence) */
  audioBlob: Blob | null;
  /** Audio MIME type */
  audioMimeType: string | null;
  /** Recording duration in seconds */
  duration: number;
  /** Start time of recording (for timestamp sync) */
  startTime: number | null;
  /** Start recording */
  startRecording: () => Promise<void>;
  /** Stop recording */
  stopRecording: () => void;
  /** Restore audio from a blob (for session restore) */
  restoreAudio: (blob: Blob, mimeType: string | null, startTimeMs: number | null) => void;
  /** Clear recorded audio */
  reset: () => void;
  /** Error message */
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine best supported mime type
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          // Fallback to default
          mimeType = "";
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create blob from collected chunks
        const finalMimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMimeType });

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setAudioBlob(blob);
          setAudioMimeType(finalMimeType);
        }

        setDuration((Date.now() - startTimeRef.current) / 1000);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();
      setStartTime(Date.now());

      // Start with timeslice to get data periodically
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Could not access microphone");
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    // Check MediaRecorder's actual state, not React state
    // This avoids stale closure issues
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }

    setIsRecording(false);
  }, []);

  const restoreAudio = useCallback((blob: Blob, mimeType: string | null, startTimeMs: number | null) => {
    // Revoke any existing URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setAudioBlob(blob);
    setAudioMimeType(mimeType);
    setStartTime(startTimeMs);
  }, [audioUrl]);

  const reset = useCallback(() => {
    // Stop any ongoing recording
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }

    // Revoke old URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setAudioUrl(null);
    setAudioBlob(null);
    setAudioMimeType(null);
    setDuration(0);
    setStartTime(null);
    setError(null);
    setIsRecording(false);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [audioUrl]);

  return {
    isRecording,
    audioUrl,
    audioBlob,
    audioMimeType,
    duration,
    startTime,
    startRecording,
    stopRecording,
    restoreAudio,
    reset,
    error,
  };
}
