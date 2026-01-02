import type { RecordingState } from '../hooks/useRecordingState'

interface RecordButtonProps {
  state: RecordingState
  onStart: () => void
  onStop: () => void
}

export function RecordButton({ state, onStart, onStop }: RecordButtonProps) {
  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const isDisabled = isProcessing

  const handleClick = () => {
    if (isDisabled) return
    if (isRecording) {
      onStop()
    } else {
      onStart()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Outer ring - pulses when recording */}
      <div
        className={`
          relative flex items-center justify-center
          w-40 h-40 sm:w-48 sm:h-48
          rounded-full
          transition-all duration-300
          ${isRecording ? 'animate-ping-slow bg-red-200' : 'bg-transparent'}
        `}
      >
        {/* Main button */}
        <button
          onClick={handleClick}
          disabled={isDisabled}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={`
            absolute
            w-32 h-32 sm:w-40 sm:h-40
            rounded-full
            flex items-center justify-center
            text-white font-semibold text-lg
            shadow-lg
            transition-all duration-200
            active:scale-95
            focus:outline-none focus:ring-4 focus:ring-offset-2
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300' 
              : isProcessing
                ? 'bg-amber-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-300'
            }
          `}
        >
          {isProcessing ? (
            <ProcessingSpinner />
          ) : isRecording ? (
            <StopIcon />
          ) : (
            <MicrophoneIcon />
          )}
        </button>
      </div>
      
      {/* Instruction text */}
      <p className="text-slate-500 text-sm">
        {isProcessing 
          ? 'Analyzing conversation...' 
          : isRecording 
            ? 'Tap to stop recording' 
            : 'Tap to start recording'}
      </p>
    </div>
  )
}

function MicrophoneIcon() {
  return (
    <svg 
      className="w-12 h-12 sm:w-14 sm:h-14" 
      fill="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.08A7 7 0 0 0 19 11Z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg 
      className="w-12 h-12 sm:w-14 sm:h-14" 
      fill="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

function ProcessingSpinner() {
  return (
    <svg 
      className="w-12 h-12 sm:w-14 sm:h-14 animate-spin" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

