import { StatusBadge } from "./StatusBadge";
import { ThemeToggle } from "./ThemeToggle";
import type { RecordingState } from "../hooks/useRecordingState";

interface HeaderProps {
  state: RecordingState;
}

export function Header({ state }: HeaderProps) {
  return (
    <header className="bg-teal-700 dark:bg-slate-800 text-white px-4 py-3.5 shadow-md dark:shadow-slate-900/50 transition-colors">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
        <div className="flex items-center gap-3">
          <StatusBadge state={state} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
