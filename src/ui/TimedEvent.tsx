import { useEffect, useRef, useState } from 'react'
import { ActionButton } from './components/common/ActionButton'
import { StatusPill } from './components/common/StatusPill'
import type { TimedEventViewModel } from './types/uiViewModel'

interface TimedEventProps {
  event: TimedEventViewModel
  isOpen: boolean
  onChoose: (optionId: string) => void
  onTimeout: (fallbackOptionId: string) => void
  onContactEarth: () => void
  contactPending?: boolean
  onClose: () => void
}

export function TimedEvent({ event, isOpen, onChoose, onTimeout, onContactEarth, contactPending = false, onClose }: TimedEventProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(event.durationSeconds)
  const completedRef = useRef(false)
  const callbacksRef = useRef({ onTimeout, onChoose })

  useEffect(() => {
    callbacksRef.current = { onTimeout, onChoose }
  }, [onTimeout, onChoose])

  useEffect(() => {
    if (!isOpen) return
    completedRef.current = false

    let currentSeconds = event.durationSeconds
    const timerId = window.setInterval(() => {
      currentSeconds -= 1
      setRemainingSeconds(Math.max(0, currentSeconds))
      if (currentSeconds <= 0) {
        window.clearInterval(timerId)
        if (!completedRef.current) {
          completedRef.current = true
          callbacksRef.current.onTimeout(event.timeoutChoiceId)
        }
      }
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [isOpen, event.id, event.durationSeconds, event.timeoutChoiceId])

  if (!isOpen) return null

  const progress = Math.min(100, Math.max(0, (remainingSeconds / event.durationSeconds) * 100))

  function choose(optionId: string) {
    if (completedRef.current || remainingSeconds <= 0) return
    completedRef.current = true
    onChoose(optionId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="timed-event-title" className="my-auto w-full max-w-lg rounded-2xl border border-amber-500/40 bg-slate-950 p-5 shadow-2xl shadow-black/50 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <StatusPill tone="warning">Timed event</StatusPill>
          <p className="text-sm font-black tabular-nums text-amber-200">00:{String(remainingSeconds).padStart(2, '0')}</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-amber-400 transition-[width] duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <h2 id="timed-event-title" className="mt-5 text-xl font-black text-white">{event.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{event.description}</p>
        {contactPending && <p role="status" aria-live="polite" className="mt-3 rounded-lg border border-sky-800 bg-sky-950/50 px-3 py-2 text-xs text-sky-200">Contact Earth request sent. Waiting for the response; the event timer continues.</p>}
        <div className="mt-5 grid gap-2">
          {event.options.map((option, index) => (
            <button key={option.id} type="button" onClick={() => choose(option.id)} className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-left transition-colors hover:border-amber-500/70 hover:bg-slate-800">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">Response {index + 1}</span>
              <span className="mt-1 block text-sm font-bold text-slate-100">{option.title}</span>
              <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <ActionButton variant="ghost" onClick={onContactEarth} disabled={contactPending}>Contact Earth</ActionButton>
          <ActionButton variant="secondary" onClick={onClose}>Close preview</ActionButton>
        </div>
        <p className="mt-2 text-[10px] text-slate-600">Contact Earth does not pause this countdown. Timeout sends the configured fallback once.</p>
      </section>
    </div>
  )
}
