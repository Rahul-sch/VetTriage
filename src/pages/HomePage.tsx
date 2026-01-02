import { useEffect } from "react";
import { Header } from "../components/Header";
import { RecordButton } from "../components/RecordButton";
import { TranscriptDisplay } from "../components/TranscriptDisplay";
import { UnsupportedBrowser } from "../components/UnsupportedBrowser";
import { useRecordingState } from "../hooks/useRecordingState";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

export function HomePage() {
  const { state, startRecording, stopRecording } = useRecordingState();
  const {
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    reset,
  } = useSpeechRecognition();

  // Sync speech recognition with recording state
  useEffect(() => {
    if (state === "recording") {
      startListening();
    } else {
      stopListening();
    }
  }, [state, startListening, stopListening]);

  // Reset transcript when going back to idle from processing
  useEffect(() => {
    if (state === "idle" && transcript === "") {
      reset();
    }
  }, [state, transcript, reset]);

  // Show fallback for unsupported browsers
  if (!isSupported) {
    return <UnsupportedBrowser />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header state={state} />

      <main className="flex-1 flex flex-col p-4 gap-6">
        {/* Transcript area - takes available space */}
        <TranscriptDisplay
          state={state}
          transcript={transcript}
          interimTranscript={interimTranscript}
          error={error}
        />

        {/* Record button - fixed at bottom, centered */}
        <div className="py-4 flex justify-center">
          <RecordButton
            state={state}
            onStart={startRecording}
            onStop={stopRecording}
          />
        </div>
      </main>
    </div>
  );
}
