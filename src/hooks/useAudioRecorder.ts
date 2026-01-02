import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderReturn {
  /** Whether recording is in progress */
  isRecording: boolean;
  /** Recorded audio blob URL (available after stop) */
  audioUrl: string | null;
  /** Recording duration in seconds */
  duration: number;
  /** Start time of recording (for timestamp sync) */
  startTime: number | null;
  /** Start recording */
  startRecording: () => Promise<void>;
  /** Stop recording */
  stopRecording: () => void;
  /** Clear recorded audio */
  reset: () => void;
  /** Error message */
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
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
    duration,
    startTime,
    startRecording,
    stopRecording,
    reset,
    error,
  };
}
