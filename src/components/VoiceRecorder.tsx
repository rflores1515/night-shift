'use client'

// Voice Recorder Component - Single Responsibility: handle voice input UI
// Follows Interface Segregation: only exposes voice recording capabilities

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceRecorderProps {
  babyId: string
  onLogCreated?: (log: unknown) => void
}

type RecordingState = 'idle' | 'recording' | 'processing'

export function VoiceRecorder({ babyId, onLogCreated }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const startRecording = useCallback(() => {
    // Check browser support - eslint-disable for experimental API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setState('recording')
      setError(null)
      setTranscript('')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        }
      }
      if (finalTranscript) {
        setTranscript((prev) => prev + ' ' + finalTranscript)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setError(`Error: ${event.error}`)
      setState('idle')
    }

    recognition.onend = () => {
      if (state === 'recording') {
        // Restart if still in recording state
        recognition.start()
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [state])

  const stopRecording = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (!transcript.trim()) {
      setError('No speech detected')
      setState('idle')
      return
    }

    setState('processing')
    setError(null)

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          babyId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process voice input')
      }

      const result = await response.json()
      setTranscript('')
      onLogCreated?.(result.log)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process voice')
    } finally {
      setState('idle')
    }
  }, [transcript, babyId, onLogCreated])

  const toggleRecording = () => {
    if (state === 'idle') {
      startRecording()
    } else if (state === 'recording') {
      stopRecording()
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-6 bg-white rounded-xl shadow-sm border">
      <button
        onClick={toggleRecording}
        disabled={state === 'processing'}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center transition-all flex-shrink-0
          ${
            state === 'recording'
              ? 'bg-red-500 animate-pulse'
              : state === 'processing'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
          }
        `}
        aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
      >
        {state === 'processing' ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : state === 'recording' ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>

      <div className="flex-1 text-center sm:text-left">
        <p className="text-sm text-gray-600">
          {state === 'idle' && 'Tap to start recording'}
          {state === 'recording' && 'Tap to stop and process'}
          {state === 'processing' && 'Processing your note...'}
        </p>

        {transcript && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceRecorder
