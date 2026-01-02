import { StatusBadge } from './StatusBadge'
import type { RecordingState } from '../hooks/useRecordingState'

interface HeaderProps {
  state: RecordingState
}

export function Header({ state }: HeaderProps) {
  return (
    <header className="bg-teal-700 text-white px-4 py-3 shadow-md">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
        <StatusBadge state={state} />
      </div>
    </header>
  )
}

