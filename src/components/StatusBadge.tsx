import type { RecordingState } from "../hooks/useRecordingState";

interface StatusBadgeProps {
  state: RecordingState;
}

const stateConfig: Record<
  RecordingState,
  { label: string; className: string }
> = {
  idle: {
    label: "Ready",
    className: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  },
  recording: {
    label: "Recording",
    className: "bg-red-500 text-white animate-pulse",
  },
  processing: {
    label: "Analyzing",
    className: "bg-amber-500 text-white animate-pulse",
  },
  complete: {
    label: "Complete",
    className: "bg-emerald-500 text-white",
  },
};

export function StatusBadge({ state }: StatusBadgeProps) {
  const config = stateConfig[state];

  return (
    <span
      className={`
        px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide
        transition-all duration-200 shadow-sm
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}
