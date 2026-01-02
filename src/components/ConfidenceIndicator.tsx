import { useState } from "react";
import type { ConfidenceMetadata, ConfidenceLevel } from "../types/report";

interface ConfidenceIndicatorProps {
  confidence: ConfidenceMetadata;
  /** Size variant */
  size?: "sm" | "md";
  /** Show percentage on hover */
  showPercentage?: boolean;
}

const levelConfig: Record<
  ConfidenceLevel,
  { color: string; bgColor: string; label: string; icon: string }
> = {
  high: {
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    label: "High confidence",
    icon: "✓",
  },
  medium: {
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    label: "Medium confidence",
    icon: "~",
  },
  low: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    label: "Low confidence",
    icon: "?",
  },
};

export function ConfidenceIndicator({
  confidence,
  size = "sm",
  showPercentage = true,
}: ConfidenceIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = levelConfig[confidence.level];
  const percentage = Math.round(confidence.score * 100);

  const sizeClasses = size === "sm" 
    ? "w-4 h-4 text-[9px]" 
    : "w-5 h-5 text-[10px]";

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className={`
          ${sizeClasses} rounded-full flex items-center justify-center
          ${config.bgColor} ${config.color} font-bold
          cursor-help transition-transform hover:scale-110
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        aria-label={`${config.label}: ${percentage}%`}
      >
        {config.icon}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
            px-3 py-2 rounded-lg shadow-lg border
            ${config.bgColor} ${config.color} border-current/20
            text-xs whitespace-nowrap
            animate-in fade-in slide-in-from-bottom-1 duration-150
          `}
        >
          <div className="font-semibold flex items-center gap-1.5">
            {config.label}
            {showPercentage && (
              <span className="font-normal opacity-75">({percentage}%)</span>
            )}
          </div>
          {confidence.note && (
            <div className="mt-1 opacity-80 max-w-[200px] text-wrap">
              {confidence.note}
            </div>
          )}
          {/* Arrow */}
          <div
            className={`
              absolute top-full left-1/2 -translate-x-1/2
              border-4 border-transparent
              ${confidence.level === "high" ? "border-t-emerald-100" : ""}
              ${confidence.level === "medium" ? "border-t-amber-100" : ""}
              ${confidence.level === "low" ? "border-t-red-100" : ""}
            `}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Compact confidence bar for displaying overall report confidence
 */
interface ConfidenceBarProps {
  score: number;
  label?: string;
}

export function ConfidenceBar({ score, label }: ConfidenceBarProps) {
  const percentage = Math.round(score * 100);
  const level: ConfidenceLevel =
    score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";
  const config = levelConfig[level];

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            level === "high"
              ? "bg-emerald-500"
              : level === "medium"
              ? "bg-amber-500"
              : "bg-red-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${config.color}`}>
        {percentage}%
      </span>
    </div>
  );
}

/**
 * Legend explaining confidence colors
 */
export function ConfidenceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
      <span>Confidence:</span>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-emerald-500" />
        <span>High (explicit)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-amber-500" />
        <span>Medium (implied)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span>Low (inferred)</span>
      </div>
    </div>
  );
}

