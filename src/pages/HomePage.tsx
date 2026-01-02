import { useEffect, useState, useCallback } from "react";
import { Header } from "../components/Header";
import { RecordButton } from "../components/RecordButton";
import { TranscriptDisplay } from "../components/TranscriptDisplay";
import { ReportPreview } from "../components/ReportPreview";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { UnsupportedBrowser } from "../components/UnsupportedBrowser";
import { useRecordingState } from "../hooks/useRecordingState";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { analyzeTranscript, hasApiKey } from "../services/groq";
import type { IntakeReport } from "../types/report";

export function HomePage() {
  const { state, startRecording, stopRecording, completeProcessing, reset } =
    useRecordingState();
  const {
    isSupported,
    transcript,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    reset: resetSpeech,
  } = useSpeechRecognition();

  const [report, setReport] = useState<IntakeReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(!hasApiKey());

  // Sync speech recognition with recording state
  useEffect(() => {
    if (state === "recording") {
      startListening();
    } else {
      stopListening();
    }
  }, [state, startListening, stopListening]);

  // Trigger analysis when entering processing state
  useEffect(() => {
    if (state === "processing" && transcript) {
      setAnalysisError(null);

      analyzeTranscript(transcript).then((result) => {
        if (result.success) {
          setReport(result.report);
          completeProcessing();
        } else {
          setAnalysisError(result.error);
          completeProcessing();
        }
      });
    }
  }, [state, transcript, completeProcessing]);

  const handleReset = useCallback(() => {
    reset();
    resetSpeech();
    setReport(null);
    setAnalysisError(null);
  }, [reset, resetSpeech]);

  const handleApiKeySet = useCallback(() => {
    setNeedsApiKey(false);
  }, []);

  // Show fallback for unsupported browsers
  if (!isSupported) {
    return <UnsupportedBrowser />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header state={state} />

      {/* API Key Modal */}
      {needsApiKey && <ApiKeyModal onKeySet={handleApiKeySet} />}

      <main className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto">
        {/* Show report if complete and available */}
        {state === "complete" && report ? (
          <ReportPreview report={report} />
        ) : state === "complete" && analysisError ? (
          <div className="flex-1 w-full max-w-2xl mx-auto bg-white rounded-xl shadow-sm border-2 border-red-300 p-6">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-red-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                Analysis Failed
              </h3>
              <p className="text-slate-600">{analysisError}</p>
            </div>
          </div>
        ) : (
          /* Transcript area during recording/idle */
          <TranscriptDisplay
            state={state}
            transcript={transcript}
            interimTranscript={interimTranscript}
            error={speechError}
          />
        )}

        {/* Record button */}
        <div className="py-4 flex justify-center shrink-0">
          <RecordButton
            state={state}
            onStart={startRecording}
            onStop={stopRecording}
            onReset={handleReset}
          />
        </div>
      </main>
    </div>
  );
}
