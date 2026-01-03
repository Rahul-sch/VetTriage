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
import { UrgencyPulse } from "../components/UrgencyPulse";
import { useRecordingState } from "../hooks/useRecordingState";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useUrgencyPulse } from "../hooks/useUrgencyPulse";
import { analyzeTranscript, hasApiKey } from "../services/groq";
import {
  saveSession,
  loadSession,
  clearSession,
} from "../services/sessionStorage";
import {
  formatTranscriptForAnalysis,
  calculateRelativeTimes,
  findActiveSegment,
} from "../types/transcript";
import { getMockTranscript } from "../utils/mockTranscript";
import { isInCooldown, getCooldownRemaining } from "../services/rateLimiter";
import type { IntakeReport } from "../types/report";
import {
  createVisit,
  getVisitByToken,
  updateVisitStatus,
} from "../services/visitStorage";
import type { Visit } from "../types/visit";

// Feature flag: Real-Time Urgency Pulse (disabled for stability)
const ENABLE_URGENCY_PULSE = false;

export function HomePage() {
  const {
    state,
    startRecording,
    stopRecording,
    completeProcessing,
    reset,
    setState,
  } = useRecordingState();
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
    setSegments,
  } = useSpeechRecognition();

  const {
    audioUrl,
    audioBlob,
    audioMimeType,
    startTime: recordingStartTime,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    restoreAudio,
    reset: resetAudio,
  } = useAudioRecorder();

  const [report, setReport] = useState<IntakeReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(!hasApiKey());
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [isTestTranscriptMode, setIsTestTranscriptMode] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [visitUrl, setVisitUrl] = useState<string | null>(null);
  const [isCreatingVisit, setIsCreatingVisit] = useState(false);

  // Ref for audio player to allow seeking
  const audioSeekTimeRef = useRef<number | null>(null);

  // Single-flight lock for runAnalysis
  const isRunningAnalysisRef = useRef<boolean>(false);

  // Real-time urgency pulse during recording (DISABLED via feature flag)
  // Always call hook (React rules), but pass false to prevent any API calls
  const { urgency, justEscalated, resetEscalation } = useUrgencyPulse(
    segments,
    ENABLE_URGENCY_PULSE && state === "recording" && !isTestTranscriptMode
  );

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

  // Session restore disabled on initial mount to prevent crashes
  // Session will be restored manually via user action if needed
  useEffect(() => {
    // Mark as restored immediately without actually restoring
    // This allows save operations to work, but prevents auto-restore on mount
    setSessionRestored(true);
  }, []);

  // Save session when segments change
  useEffect(() => {
    if (!sessionRestored) return;
    if (segments.length === 0) return;

    saveSession({
      segments,
      recordingStartTime,
    });
  }, [segments, recordingStartTime, sessionRestored]);

  // Save session when audio is recorded
  useEffect(() => {
    if (!sessionRestored) return;
    if (!audioBlob) return;

    saveSession({
      audioBlob,
      audioMimeType,
      recordingStartTime,
    });
  }, [audioBlob, audioMimeType, recordingStartTime, sessionRestored]);

  // Save session when report changes
  useEffect(() => {
    if (!sessionRestored) return;
    if (!report) return;

    saveSession({ report });
  }, [report, sessionRestored]);

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
  }, [
    state,
    startListening,
    stopListening,
    startAudioRecording,
    stopAudioRecording,
  ]);

  // Update cooldown timer
  useEffect(() => {
    if (!isInCooldown()) {
      setCooldownSeconds(0);
      return;
    }

    // Update immediately
    setCooldownSeconds(getCooldownRemaining());

    // Update every second
    const interval = window.setInterval(() => {
      const remaining = getCooldownRemaining();
      setCooldownSeconds(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [analysisError]); // Re-check when error changes (429 might set cooldown)

  // Run analysis directly - called from stopRecording and analyzeLoadedTranscript
  const runAnalysis = useCallback(async () => {
    // Single-flight lock: prevent duplicate calls
    if (isRunningAnalysisRef.current) {
      console.log("runAnalysis: already in progress, skipping duplicate call");
      return;
    }

    if (segments.length === 0) {
      completeProcessing();
      return;
    }

    isRunningAnalysisRef.current = true;
    setState("processing");
    setAnalysisError(null);

    // Minimal delay (urgency pulse disabled, so no in-flight requests to wait for)
    const delayMs = isTestTranscriptMode ? 100 : 200;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      // Format transcript with speaker labels for AI
      const formattedTranscript = formatTranscriptForAnalysis(segments);
      const result = await analyzeTranscript(formattedTranscript);

      if (result.success) {
        setReport(result.report);
      } else {
        setAnalysisError(result.error || "Analysis failed");
        // Check if cooldown was set
        setCooldownSeconds(getCooldownRemaining());
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      // Always complete processing to prevent stuck state
      completeProcessing();
      // Always release the lock
      isRunningAnalysisRef.current = false;
    }
  }, [segments, isTestTranscriptMode, setState, completeProcessing]);

  const handleReset = useCallback(async () => {
    // Clear IndexedDB session
    await clearSession();

    // Reset all state
    reset();
    resetSpeech();
    resetAudio();
    setReport(null);
    setAnalysisError(null);
    setAudioCurrentTime(0);
    audioSeekTimeRef.current = null;
    setIsTestTranscriptMode(false);
    setCooldownSeconds(0);

    console.log("Session cleared");
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

  // Handle report edit - save to session
  const handleReportEdit = useCallback((editedReport: IntakeReport) => {
    saveSession({ editedReport });
  }, []);

  // Start new recording - clears previous session state
  const handleStartRecording = useCallback(() => {
    // Clear previous analysis results before starting new recording
    setReport(null);
    setAnalysisError(null);
    setIsTestTranscriptMode(false);
    resetSpeech();
    resetAudio();
    startRecording();
  }, [startRecording, resetSpeech, resetAudio]);

  // Load test transcript for demo/debugging - always available
  const loadTestTranscript = useCallback(() => {
    // Full reset: clear everything before loading test transcript
    reset(); // Set state to "idle"
    resetSpeech(); // Clear transcript segments
    resetAudio(); // Clear audio recording
    setReport(null); // Clear any existing report
    setAnalysisError(null); // Clear any errors
    setIsTestTranscriptMode(true); // Enable test mode

    // Load mock transcript
    const mockSegments = getMockTranscript();
    setSegments(mockSegments);

    // Clear session to ensure clean state
    clearSession().catch(console.error);
  }, [reset, resetSpeech, resetAudio, setSegments]);

  // Trigger analysis of loaded transcript
  const analyzeLoadedTranscript = useCallback(() => {
    if (state !== "idle" || segments.length === 0) return;
    runAnalysis();
  }, [state, segments.length, runAnalysis]);

  // Create visit link
  const handleCreateVisit = useCallback(async () => {
    if (isCreatingVisit) return;
    
    setIsCreatingVisit(true);
    try {
      const visit = await createVisit();
      if (visit && visit.visitToken) {
        setCurrentVisit(visit);
        const url = `${window.location.origin}/owner/${visit.visitToken}`;
        setVisitUrl(url);
      } else {
        throw new Error("Invalid visit response");
      }
    } catch (error) {
      console.error("Failed to create visit:", error);
      alert(
        error instanceof Error
          ? `Failed to create visit: ${error.message}`
          : "Failed to create visit. Please try again."
      );
    } finally {
      setIsCreatingVisit(false);
    }
  }, [isCreatingVisit]);

  // Copy visit URL to clipboard
  const handleCopyVisitUrl = useCallback(async () => {
    if (!visitUrl) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(visitUrl);
        alert("Visit URL copied to clipboard!");
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = visitUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Visit URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to copy URL:", error);
      alert("Failed to copy URL. Please copy it manually.");
    }
  }, [visitUrl]);

  // Share summary with owner
  const handleShareSummary = useCallback(async () => {
    if (!currentVisit || !report) return;

    try {
      const updated = await updateVisitStatus(
        currentVisit.visitToken,
        "shared"
      );
      if (updated) {
        setCurrentVisit(updated);
        alert(
          "Summary shared with owner! They can now view it at the visit link."
        );
      } else {
        alert("Failed to share summary. Please try again.");
      }
    } catch (error) {
      console.error("Failed to share summary:", error);
      alert("Failed to share summary. Please try again.");
    }
  }, [currentVisit, report]);

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

      {/* Real-Time Urgency Pulse (DISABLED via feature flag) */}
      {ENABLE_URGENCY_PULSE && state === "recording" && (
        <div className="w-full max-w-2xl mx-auto px-4 pt-2">
          <div className="flex justify-center">
            <UrgencyPulse
              urgency={urgency}
              justEscalated={justEscalated}
              onEscalationAcknowledged={resetEscalation}
            />
          </div>
        </div>
      )}

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

        {/* Main content area - render based on state */}
        {state === "processing" ? (
          /* Loading state during analysis - always show spinner */
          <div className="flex-1 w-full max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Analyzing Conversation...
              </h3>
              <p className="text-sm text-slate-500">
                Extracting structured data from transcript
              </p>
            </div>
          </div>
        ) : state === "complete" && report ? (
          /* Report available */
          <>
            {/* Owner Intake Data (if available) */}
            {currentVisit?.intakeData && currentVisit.intakeData.petName && (
              <div className="w-full max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-6 mb-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📋</span>
                  Owner Intake Information
                </h3>
                <div className="space-y-3 text-sm">
                  {currentVisit.intakeData.petName && (
                    <div>
                      <span className="font-medium text-slate-700">
                        Pet Name:
                      </span>{" "}
                      <span className="text-slate-800">
                        {currentVisit.intakeData.petName}
                      </span>
                    </div>
                  )}
                  {currentVisit.intakeData.symptoms && (
                    <div>
                      <span className="font-medium text-slate-700">
                        Symptoms:
                      </span>
                      <p className="text-slate-800 mt-1 whitespace-pre-wrap">
                        {currentVisit.intakeData.symptoms}
                      </p>
                    </div>
                  )}
                  {currentVisit.intakeData.duration && (
                    <div>
                      <span className="font-medium text-slate-700">
                        Duration:
                      </span>{" "}
                      <span className="text-slate-800">
                        {currentVisit.intakeData.duration}
                      </span>
                    </div>
                  )}
                  {currentVisit.intakeData.concerns && (
                    <div>
                      <span className="font-medium text-slate-700">
                        Additional Concerns:
                      </span>
                      <p className="text-slate-800 mt-1 whitespace-pre-wrap">
                        {currentVisit.intakeData.concerns}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <ReportPreview
              report={report}
              onReportEdit={handleReportEdit}
              visit={currentVisit}
              onShareSummary={currentVisit ? handleShareSummary : undefined}
            />
          </>
        ) : state === "complete" && analysisError ? (
          /* Analysis error */
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
              {cooldownSeconds > 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  Retry available in {cooldownSeconds} seconds...
                </p>
              )}
            </div>
          </div>
        ) : state === "complete" ? (
          /* Fallback for complete state with no report or error - should not happen */
          <div className="flex-1 w-full max-w-2xl mx-auto bg-white rounded-xl shadow-sm border-2 border-amber-300 p-6">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-amber-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-amber-700 mb-2">
                No Report Available
              </h3>
              <p className="text-slate-600 mb-4">
                Analysis completed but no report was generated. Please try
                again.
              </p>
            </div>
          </div>
        ) : (
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
        )}

        {/* Record button */}
        <div className="py-4 flex flex-col items-center gap-3 shrink-0">
          <RecordButton
            state={state}
            onStart={handleStartRecording}
            onStop={() => {
              stopRecording();
              // Run analysis immediately after stopping
              setTimeout(() => runAnalysis(), 100);
            }}
            onReset={handleReset}
          />

          {/* Create Visit Link button */}
          {!currentVisit && (
            <button
              onClick={handleCreateVisit}
              disabled={isCreatingVisit}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isCreatingVisit
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "text-white bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isCreatingVisit ? "Creating..." : "🔗 Create Visit Link"}
            </button>
          )}

          {/* Visit URL display */}
          {visitUrl && (
            <div className="w-full max-w-md bg-white border border-teal-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-slate-700">
                Owner Visit Link:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={visitUrl}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:outline-none"
                />
                <button
                  onClick={handleCopyVisitUrl}
                  className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Test transcript button - always available for demo/testing */}
          <button
            onClick={loadTestTranscript}
            className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
          >
            🧪 Load Test Transcript (Demo)
          </button>

          {state === "idle" && segments.length > 0 && (
            <button
              onClick={analyzeLoadedTranscript}
              disabled={cooldownSeconds > 0}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                cooldownSeconds > 0
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "text-white bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {cooldownSeconds > 0
                ? `Wait ${cooldownSeconds}s...`
                : "Analyze Transcript"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
