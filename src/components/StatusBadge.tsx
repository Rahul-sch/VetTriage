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
    className: "bg-slate-200 text-slate-600",
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
    className: "bg-green-500 text-white",
  },
};

export function StatusBadge({ state }: StatusBadgeProps) {
  const config = stateConfig[state];

  return (
    <span
      className={`
        px-3 py-1 rounded-full text-sm font-medium
        transition-colors duration-200
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}
