import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { useAuth } from '../../../context/AuthContext'
import { uploadAudio } from '../../../firebase/storageHelpers'

const MAX_SECONDS = 120

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VoiceMemoElement({ element }) {
  const { data } = element
  const { notebook, updateElement } = useEditorStore()
  const { user } = useAuth()
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const startRef = useRef(0)

  useEffect(() => () => {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    clearInterval(timerRef.current)
  }

  const startRecording = async (e) => {
    e.stopPropagation()
    setError('')
    if (!user || !notebook) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = ev => { if (ev.data.size > 0) chunksRef.current.push(ev.data) }
      recorder.onstop = async () => {
        stopStream()
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const duration = Math.round((Date.now() - startRef.current) / 1000)
        setUploading(true)
        try {
          const audio = await uploadAudio(blob, user.uid, notebook.id, duration)
          updateElement(element.id, { data: { ...data, storageUrl: audio.storageUrl, duration } })
        } catch {
          setError('Upload failed — try again')
        } finally {
          setUploading(false)
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      startRef.current = Date.now()
      setRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          if (next >= MAX_SECONDS) {
            mediaRecorderRef.current?.stop()
            setRecording(false)
          }
          return next
        })
      }, 1000)
    } catch {
      setError('Microphone access denied')
    }
  }

  const stopRecording = (e) => {
    e.stopPropagation()
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const reRecord = (e) => {
    e.stopPropagation()
    updateElement(element.id, { data: { ...data, storageUrl: null, duration: 0 } })
  }

  if (!data.storageUrl) {
    return (
      <div className="h-full w-full border-2 border-dashed border-stone-300 bg-stone-100 rounded-lg flex flex-col items-center justify-center gap-2 text-stone-400 select-none px-3 text-center">
        <span className="text-2xl">{recording ? '⏺' : uploading ? '⏳' : '🎙'}</span>
        {recording ? (
          <>
            <span className="text-sm font-mono text-red-500">{formatTime(elapsed)}</span>
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-full shadow active:bg-red-700 transition-colors"
            >
              Stop recording
            </button>
          </>
        ) : uploading ? (
          <span className="text-xs font-medium">Uploading…</span>
        ) : (
          <>
            <span className="text-xs font-medium">Voice Memo</span>
            <button
              onClick={startRecording}
              className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-full shadow active:bg-amber-700 transition-colors"
            >
              Tap to record
            </button>
          </>
        )}
        {error && <span className="text-[10px] text-red-500">{error}</span>}
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-amber-50 border border-amber-200 rounded-lg flex flex-col items-center justify-center gap-2 px-3 py-2" onClick={e => e.stopPropagation()}>
      <span className="text-lg">🎙</span>
      <audio controls src={data.storageUrl} className="w-full max-w-full" style={{ height: 32 }} />
      {data.label && <span className="text-[11px] text-stone-500 italic text-center">{data.label}</span>}
      <button
        onClick={reRecord}
        className="text-[10px] text-stone-400 hover:text-amber-700 transition-colors"
      >
        Re-record
      </button>
    </div>
  )
}
