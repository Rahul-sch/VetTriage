import { useState } from "react";
import type { TranscriptSegment } from "../types/transcript";
import { getHighlightType, type HighlightType } from "../utils/highlightDetection";

interface CollapsibleTranscriptProps {
  segments: TranscriptSegment[];
  onSegmentClick?: (index: number, relativeTime: number) => void;
  activeSegmentIndex?: number;
}

export function CollapsibleTranscript({
  segments,
  onSegmentClick,
  activeSegmentIndex = -1,
}: CollapsibleTranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (segments.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <TranscriptIcon />
          {isExpanded ? "Hide Transcript" : "Show Transcript"}
        </span>
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      {/* Expandable content */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? "max-h-[60vh] opacity-100 mt-2" : "max-h-0 opacity-0"}
        `}
      >
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Legend */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <span className="text-slate-500">Highlights:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
              <span className="text-slate-600">Diagnosis</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
              <span className="text-slate-600">Recommendation</span>
            </div>
          </div>

          {/* Transcript content */}
          <div className="p-4 max-h-[50vh] overflow-y-auto space-y-3">
            {segments.map((segment, index) => {
              const highlightType = getHighlightType(segment.text);
              const isActive = index === activeSegmentIndex;
              const isClickable = onSegmentClick && segment.relativeTime !== undefined;

              return (
                <TranscriptSegmentItem
                  key={index}
                  segment={segment}
                  highlightType={highlightType}
                  isActive={isActive}
                  isClickable={!!isClickable}
                  onClick={() => {
                    if (isClickable && segment.relativeTime !== undefined) {
                      onSegmentClick(index, segment.relativeTime);
                    }
                  }}
                />
              );
            })}
          </div>

          {/* Speaker legend */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-4 text-xs">
            <span className="text-slate-500">Speakers:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-slate-600">Vet</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-600">Owner</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TranscriptSegmentItemProps {
  segment: TranscriptSegment;
  highlightType: HighlightType;
  isActive: boolean;
  isClickable: boolean;
  onClick: () => void;
}

function TranscriptSegmentItem({
  segment,
  highlightType,
  isActive,
  isClickable,
  onClick,
}: TranscriptSegmentItemProps) {
  const isVet = segment.speaker === "vet";

  // Background colors based on highlight type
  let bgClass = "";
  let borderClass = "";
  if (highlightType === "diagnosis") {
    bgClass = "bg-purple-50";
    borderClass = "border-l-4 border-purple-400";
  } else if (highlightType === "recommendation") {
    bgClass = "bg-emerald-50";
    borderClass = "border-l-4 border-emerald-400";
  }

  return (
    <div
      onClick={onClick}
      className={`
        flex gap-3 p-3 rounded-lg transition-all
        ${bgClass || "bg-slate-50"}
        ${borderClass}
        ${isActive ? "ring-2 ring-teal-400 bg-teal-50" : ""}
        ${isClickable ? "cursor-pointer hover:shadow-sm" : ""}
      `}
    >
      {/* Timestamp */}
      {segment.relativeTime !== undefined && (
        <span className="text-xs text-slate-400 font-mono shrink-0 pt-0.5">
          {formatTime(segment.relativeTime)}
        </span>
      )}

      {/* Speaker badge */}
      <span
        className={`
          shrink-0 w-6 h-6 rounded-full flex items-center justify-center
          text-[10px] font-bold text-white
          ${isVet ? "bg-teal-500" : "bg-amber-500"}
        `}
      >
        {isVet ? "V" : "O"}
      </span>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p
          className={`
            text-sm leading-relaxed
            ${isVet ? "text-teal-800" : "text-amber-800"}
            ${isActive ? "font-medium" : ""}
          `}
        >
          {segment.text}
        </p>

        {/* Highlight badge */}
        {highlightType && (
          <span
            className={`
              inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full
              ${highlightType === "diagnosis" 
                ? "bg-purple-100 text-purple-700" 
                : "bg-emerald-100 text-emerald-700"}
            `}
          >
            {highlightType === "diagnosis" ? "📋 Diagnosis" : "💊 Recommendation"}
          </span>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function TranscriptIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
        isExpanded ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

