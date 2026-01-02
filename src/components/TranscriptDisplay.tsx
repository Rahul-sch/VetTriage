import type { RecordingState } from "../hooks/useRecordingState";
import type { SpeechError } from "../hooks/useSpeechRecognition";

interface TranscriptDisplayProps {
  state: RecordingState;
  transcript: string;
  interimTranscript: string;
  error: SpeechError | null;
}

export function TranscriptDisplay({
  state,
  transcript,
  interimTranscript,
  error,
}: TranscriptDisplayProps) {
  const isRecording = state === "recording";
  const hasContent =
    transcript.trim().length > 0 || interimTranscript.trim().length > 0;

  // Error display
  if (error) {
    return (
      <div
        className={`
          flex-1 w-full max-w-2xl mx-auto
          bg-white rounded-xl shadow-sm
          border-2 border-red-300
          overflow-hidden
        `}
      >
        <div className="p-4 h-full overflow-y-auto min-h-[200px] max-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <ErrorIcon />
            <p className="text-red-600 font-medium mt-2">
              {getErrorMessage(error)}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {getErrorHint(error)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        flex-1 w-full max-w-2xl mx-auto
        bg-white rounded-xl shadow-sm
        border-2 transition-colors duration-200
        ${isRecording ? "border-red-300" : "border-slate-200"}
        overflow-hidden
      `}
    >
      <div className="p-4 h-full overflow-y-auto min-h-[200px] max-h-[40vh]">
        {hasContent ? (
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {/* Final transcript in normal text */}
            {transcript}
            {/* Interim transcript in lighter italic text */}
            {interimTranscript && (
              <span className="text-slate-400 italic">{interimTranscript}</span>
            )}
          </p>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-400 text-center">
              {isRecording ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Listening...
                </span>
              ) : (
                "Transcript will appear here"
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="w-12 h-12 text-red-400 mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function getErrorMessage(error: SpeechError): string {
  switch (error) {
    case "not-supported":
      return "Speech recognition not supported";
    case "permission-denied":
      return "Microphone access denied";
    case "no-speech":
      return "No speech detected";
    case "network":
      return "Network error";
    default:
      return "An error occurred";
  }
}

function getErrorHint(error: SpeechError): string {
  switch (error) {
    case "not-supported":
      return "Please use Chrome, Edge, or Safari for voice recording.";
    case "permission-denied":
      return "Please allow microphone access and try again.";
    case "no-speech":
      return "Try speaking louder or check your microphone.";
    case "network":
      return "Check your internet connection.";
    default:
      return "Please try again.";
  }
}
