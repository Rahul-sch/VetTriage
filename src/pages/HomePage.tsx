import { Header } from '../components/Header'
import { RecordButton } from '../components/RecordButton'
import { TranscriptDisplay } from '../components/TranscriptDisplay'
import { useRecordingState } from '../hooks/useRecordingState'

export function HomePage() {
  const { state, startRecording, stopRecording } = useRecordingState()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header state={state} />
      
      <main className="flex-1 flex flex-col p-4 gap-6">
        {/* Transcript area - takes available space */}
        <TranscriptDisplay state={state} />
        
        {/* Record button - fixed at bottom, centered */}
        <div className="py-4 flex justify-center">
          <RecordButton 
            state={state}
            onStart={startRecording}
            onStop={stopRecording}
          />
        </div>
      </main>
    </div>
  )
}

