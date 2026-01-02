import type { RecordingState } from "../hooks/useRecordingState";
import type { SpeechError } from "../hooks/useSpeechRecognition";
import type { TranscriptSegment, Speaker } from "../types/transcript";

interface TranscriptDisplayProps {
  state: RecordingState;
  segments: TranscriptSegment[];
  currentSpeaker: Speaker;
  interimTranscript: string;
  error: SpeechError | null;
  onToggleSpeaker?: () => void;
}

export function TranscriptDisplay({
  state,
  segments,
  currentSpeaker,
  interimTranscript,
  error,
  onToggleSpeaker,
}: TranscriptDisplayProps) {
  const isRecording = state === "recording";
  const hasContent = segments.length > 0 || interimTranscript.trim().length > 0;

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
            <p className="text-slate-500 text-sm mt-1">{getErrorHint(error)}</p>
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
        overflow-hidden flex flex-col
      `}
    >
      {/* Speaker indicator during recording */}
      {isRecording && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              Current Speaker:
            </span>
            <SpeakerBadge speaker={currentSpeaker} />
          </div>
          {onToggleSpeaker && (
            <button
              onClick={onToggleSpeaker}
              className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
            >
              Switch Speaker
            </button>
          )}
        </div>
      )}

      <div className="p-4 flex-1 overflow-y-auto min-h-[200px] max-h-[40vh]">
        {hasContent ? (
          <div className="space-y-3">
            {/* Render each segment */}
            {segments.map((segment, i) => (
              <div key={i} className="flex gap-2">
                <SpeakerBadge speaker={segment.speaker} compact />
                <p
                  className={`
                    flex-1 leading-relaxed
                    ${segment.speaker === "vet" ? "text-teal-800" : "text-amber-800"}
                  `}
                >
                  {segment.text}
                </p>
              </div>
            ))}

            {/* Interim transcript */}
            {interimTranscript && (
              <div className="flex gap-2">
                <SpeakerBadge speaker={currentSpeaker} compact />
                <p
                  className={`
                    flex-1 leading-relaxed italic opacity-60
                    ${currentSpeaker === "vet" ? "text-teal-600" : "text-amber-600"}
                  `}
                >
                  {interimTranscript}
                </p>
              </div>
            )}
          </div>
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

      {/* Legend */}
      {hasContent && !isRecording && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-4">
          <span className="text-xs text-slate-500">Speakers:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="text-xs text-slate-600">Vet</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-600">Owner</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SpeakerBadge({
  speaker,
  compact = false,
}: {
  speaker: Speaker;
  compact?: boolean;
}) {
  const isVet = speaker === "vet";

  if (compact) {
    return (
      <span
        className={`
          shrink-0 w-6 h-6 rounded-full flex items-center justify-center
          text-[10px] font-bold text-white
          ${isVet ? "bg-teal-500" : "bg-amber-500"}
        `}
      >
        {isVet ? "V" : "O"}
      </span>
    );
  }

  return (
    <span
      className={`
        px-2 py-0.5 rounded-full text-xs font-semibold
        ${isVet ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}
      `}
    >
      {isVet ? "Vet" : "Owner"}
    </span>
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
