import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Header } from "../components/Header";
import { RecordButton } from "../components/RecordButton";
import { TranscriptDisplay } from "../components/TranscriptDisplay";
import { ReportPreview } from "../components/ReportPreview";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { UnsupportedBrowser } from "../components/UnsupportedBrowser";
import { OfflineBanner } from "../components/OfflineBanner";
import { AudioPlayer } from "../components/AudioPlayer";
import { CollapsibleTranscript } from "../components/CollapsibleTranscript";
import { useRecordingState } from "../hooks/useRecordingState";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { analyzeTranscript, hasApiKey } from "../services/groq";
import {
  formatTranscriptForAnalysis,
  calculateRelativeTimes,
  findActiveSegment,
} from "../types/transcript";
import type { IntakeReport } from "../types/report";

export function HomePage() {
  const { state, startRecording, stopRecording, completeProcessing, reset } =
    useRecordingState();
  const {
    isSupported,
    segments,
    currentSpeaker,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    toggleSpeaker,
    reset: resetSpeech,
  } = useSpeechRecognition();

  const {
    audioUrl,
    startTime: recordingStartTime,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    reset: resetAudio,
  } = useAudioRecorder();

  const [report, setReport] = useState<IntakeReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(!hasApiKey());
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Ref for audio player to allow seeking
  const audioSeekTimeRef = useRef<number | null>(null);

  // Calculate segments with relative times
  const segmentsWithTimes = useMemo(() => {
    if (!recordingStartTime) return segments;
    return calculateRelativeTimes(segments, recordingStartTime);
  }, [segments, recordingStartTime]);

  // Find active segment during playback
  const activeSegmentIndex = useMemo(() => {
    if (!audioUrl) return -1;
    return findActiveSegment(segmentsWithTimes, audioCurrentTime);
  }, [segmentsWithTimes, audioCurrentTime, audioUrl]);

  // Start speech and audio recording together
  useEffect(() => {
    if (state === "recording") {
      startListening();
      // Start audio recording (async, but we don't need to wait)
      startAudioRecording().catch((err) => {
        console.error("Audio recording failed:", err);
      });
    } else if (state !== "idle") {
      // Only stop when transitioning away from recording
      stopListening();
      stopAudioRecording();
    }
  }, [state, startListening, stopListening, startAudioRecording, stopAudioRecording]);

  // Trigger analysis when entering processing state
  useEffect(() => {
    if (state === "processing" && segments.length > 0) {
      setAnalysisError(null);

      // Format transcript with speaker labels for AI
      const formattedTranscript = formatTranscriptForAnalysis(segments);

      analyzeTranscript(formattedTranscript).then((result) => {
        if (result.success) {
          setReport(result.report);
          completeProcessing();
        } else {
          setAnalysisError(result.error);
          completeProcessing();
        }
      });
    }
  }, [state, segments, completeProcessing]);

  const handleReset = useCallback(() => {
    reset();
    resetSpeech();
    resetAudio();
    setReport(null);
    setAnalysisError(null);
    setAudioCurrentTime(0);
    audioSeekTimeRef.current = null;
  }, [reset, resetSpeech, resetAudio]);

  const handleApiKeySet = useCallback(() => {
    setNeedsApiKey(false);
  }, []);

  const handleAudioTimeUpdate = useCallback((time: number) => {
    setAudioCurrentTime(time);
  }, []);

  const handleAudioSeek = useCallback((time: number) => {
    setAudioCurrentTime(time);
  }, []);

  // Handle segment click - set seek time that AudioPlayer will pick up
  const handleSegmentClick = useCallback(
    (_index: number, relativeTime: number) => {
      audioSeekTimeRef.current = relativeTime;
      setAudioCurrentTime(relativeTime);
    },
    []
  );

  // Show fallback for unsupported browsers
  if (!isSupported) {
    return <UnsupportedBrowser />;
  }

  // Only show speech errors that are actual problems (not during active recording)
  const displayError = state === "recording" ? null : speechError;

  // Show collapsible transcript after recording completes
  const showCollapsibleTranscript = 
    (state === "complete" || state === "processing") && 
    segmentsWithTimes.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Offline banner */}
      <OfflineBanner />

      <Header state={state} />

      {/* API Key Modal */}
      {needsApiKey && <ApiKeyModal onKeySet={handleApiKeySet} />}

      <main className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        {/* Audio player - show when recording is complete and we have audio */}
        {audioUrl && state !== "recording" && (
          <div className="w-full max-w-2xl mx-auto">
            <AudioPlayer
              audioUrl={audioUrl}
              seekTime={audioSeekTimeRef.current}
              onTimeUpdate={handleAudioTimeUpdate}
              onSeek={handleAudioSeek}
              onSeeked={() => {
                audioSeekTimeRef.current = null;
              }}
            />
          </div>
        )}

        {/* Collapsible transcript - show after recording completes */}
        {showCollapsibleTranscript && (
          <CollapsibleTranscript
            segments={segmentsWithTimes}
            onSegmentClick={audioUrl ? handleSegmentClick : undefined}
            activeSegmentIndex={activeSegmentIndex}
          />
        )}

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
        ) : state !== "complete" && state !== "processing" ? (
          /* Transcript area during recording/idle */
          <TranscriptDisplay
            state={state}
            segments={segmentsWithTimes}
            currentSpeaker={currentSpeaker}
            interimTranscript={interimTranscript}
            error={displayError}
            onToggleSpeaker={state === "recording" ? toggleSpeaker : undefined}
            activeSegmentIndex={activeSegmentIndex}
            onSegmentClick={audioUrl ? handleSegmentClick : undefined}
            hasAudio={!!audioUrl}
          />
        ) : null}

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
