import { useState } from 'react'
import { IconifyIcon } from './IconifyIcon'

interface EarthCommsHUDProps {
  onOpen?: () => void
  onRequestContact?: () => void
}

export function EarthCommsHUD({ onOpen, onRequestContact }: EarthCommsHUDProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [requestQueued, setRequestQueued] = useState(false)

  function togglePanel() {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    if (nextOpen) onOpen?.()
  }

  function requestContact() {
    setRequestQueued(true)
    onRequestContact?.()
  }

  return (
    <aside className="fixed bottom-4 left-3 z-50 w-[min(100%,18rem)] sm:bottom-5 sm:left-5" aria-label="Earth communications control">
      {isOpen && (
        <section className="mb-2 overflow-hidden rounded-2xl border border-slate-600/80 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-700/80 px-3 py-3">
            <div className="flex items-center gap-2">
              <IconifyIcon icon="mdi:earth" size={19} className="text-cyan-200" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-100">Earth communications</p>
                <p className="text-[8px] uppercase tracking-wider text-slate-500">Deep-space communications</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close Earth communications">
              <IconifyIcon icon="mdi:close" size={17} />
            </button>
          </div>
          <div className="space-y-3 p-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                <span className="text-[10px] font-semibold text-slate-300">Link status</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">Preview only</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-900 px-2.5 py-2">
                <p className="text-[8px] uppercase tracking-wider text-slate-500">One-way light time</p>
                <p className="mt-1 text-[10px] font-bold text-slate-200">Awaiting orbital data</p>
              </div>
              <div className="rounded-lg bg-slate-900 px-2.5 py-2">
                <p className="text-[8px] uppercase tracking-wider text-slate-500">Signal channel</p>
                <p className="mt-1 text-[10px] font-bold text-slate-200">Not connected</p>
              </div>
            </div>
            <p className="text-[9px] leading-relaxed text-slate-500">Local UI preview only. A real Earth link and one-way light time require the approved communications and planetary-ephemeris services.</p>
            <button
              type="button"
              onClick={requestContact}
              disabled={requestQueued}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-default disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"
            >
              <IconifyIcon icon="mdi:radio-tower" size={16} />
              {requestQueued ? 'Request queued · preview' : 'Request contact'}
            </button>
            {requestQueued && <p role="status" className="text-center text-[8px] text-amber-300">Request staged in this preview. No signal has been transmitted.</p>}
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-cyan-300/35 bg-slate-950/95 px-3 py-2.5 text-left shadow-xl shadow-black/40 backdrop-blur-xl transition hover:border-cyan-200/70 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
            <IconifyIcon icon="mdi:earth" size={21} />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-100">Contact Earth</span>
            <span className="mt-0.5 block text-[8px] uppercase tracking-wider text-slate-500">Deep-space link</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-300/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Standby
        </span>
      </button>
    </aside>
  )
}
