import { useRef, useEffect } from "react";
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
  /** Index of currently active segment (for playback highlighting) */
  activeSegmentIndex?: number;
  /** Callback when a segment is clicked for audio seeking */
  onSegmentClick?: (segmentIndex: number, relativeTime: number) => void;
  /** Whether audio playback is available */
  hasAudio?: boolean;
}

export function TranscriptDisplay({
  state,
  segments,
  currentSpeaker,
  interimTranscript,
  error,
  onToggleSpeaker,
  activeSegmentIndex = -1,
  onSegmentClick,
  hasAudio = false,
}: TranscriptDisplayProps) {
  const isRecording = state === "recording";
  const hasContent = segments.length > 0 || interimTranscript.trim().length > 0;
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active segment during playback
  useEffect(() => {
    if (activeSegmentIndex >= 0 && activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeSegmentIndex]);

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
            {segments.map((segment, i) => {
              const isActive = i === activeSegmentIndex;
              const isClickable =
                hasAudio &&
                onSegmentClick &&
                segment.relativeTime !== undefined;

              return (
                <div
                  key={i}
                  ref={isActive ? activeSegmentRef : null}
                  onClick={() => {
                    if (isClickable && segment.relativeTime !== undefined) {
                      onSegmentClick(i, segment.relativeTime);
                    }
                  }}
                  className={`
                    flex gap-2 p-2 -mx-2 rounded-lg transition-all
                    ${isActive ? "bg-teal-50 ring-2 ring-teal-300" : ""}
                    ${isClickable ? "cursor-pointer hover:bg-slate-50" : ""}
                  `}
                >
                  {/* Timestamp */}
                  {segment.relativeTime !== undefined && (
                    <span className="text-xs text-slate-400 font-mono shrink-0 pt-1">
                      {formatTime(segment.relativeTime)}
                    </span>
                  )}

                  <SpeakerBadge speaker={segment.speaker} compact />
                  <p
                    className={`
                      flex-1 leading-relaxed
                      ${segment.speaker === "vet" ? "text-teal-800" : "text-amber-800"}
                      ${isActive ? "font-medium" : ""}
                    `}
                  >
                    {segment.text}
                  </p>

                  {/* Play indicator for clickable segments */}
                  {isClickable && !isActive && (
                    <span className="opacity-0 group-hover:opacity-100 text-slate-400">
                      <PlaySmallIcon />
                    </span>
                  )}
                </div>
              );
            })}

            {/* Interim transcript */}
            {interimTranscript && (
              <div className="flex gap-2 p-2 -mx-2">
                <span className="text-xs text-slate-400 font-mono shrink-0 pt-1">
                  --:--
                </span>
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
          {hasAudio && (
            <span className="text-xs text-slate-400 ml-auto">
              Click to jump
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

function PlaySmallIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
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
    case "network":
      return "Check your internet connection.";
    default:
      return "Please try again.";
  }
}
