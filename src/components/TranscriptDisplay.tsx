import type { RecordingState } from '../hooks/useRecordingState'

interface TranscriptDisplayProps {
  state: RecordingState
  transcript?: string
}

export function TranscriptDisplay({ state, transcript }: TranscriptDisplayProps) {
  const isRecording = state === 'recording'
  const hasTranscript = transcript && transcript.trim().length > 0

  return (
    <div 
      className={`
        flex-1 w-full max-w-2xl mx-auto
        bg-white rounded-xl shadow-sm
        border-2 transition-colors duration-200
        ${isRecording ? 'border-red-300' : 'border-slate-200'}
        overflow-hidden
      `}
    >
      <div className="p-4 h-full overflow-y-auto min-h-[200px] max-h-[40vh]">
        {hasTranscript ? (
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {transcript}
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
                'Transcript will appear here'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

