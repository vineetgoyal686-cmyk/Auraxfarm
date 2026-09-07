import React, { useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'

const LANG_MAP = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN' }

export default function VoiceInputButton({ lang = 'en', onResult }) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  function start() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.')
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = LANG_MAP[lang] || 'en-IN'
    rec.interimResults = false
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onresult = (e) => onResult(e.results[0][0].transcript)
    rec.start()
    recRef.current = rec
  }

  function stop() {
    recRef.current?.stop()
    setListening(false)
  }

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      className={`p-2 rounded-full transition ${
        listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-700 hover:scale-105'
      }`}
      title="Voice input"
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  )
}
