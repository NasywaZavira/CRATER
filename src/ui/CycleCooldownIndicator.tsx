import { StatusPill } from './components/common/StatusPill'
import type { CycleCooldownViewModel } from './types/uiViewModel'

interface CycleCooldownIndicatorProps {
  cooldown: CycleCooldownViewModel
}

const statusTone = {
  ready: 'success',
  cooling: 'warning',
  locked: 'neutral',
} as const

/**
 * Presentational indicator only. The engine supplies the status and progress;
 * this component does not create a timer or advance the cycle.
 */
export function CycleCooldownIndicator({ cooldown }: CycleCooldownIndicatorProps) {
  const progress = Math.min(100, Math.max(0, cooldown.progressPercent))

  return (
    <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Cycle cooldown</p>
          <p className="mt-1 text-xs font-semibold text-slate-200">{cooldown.label}</p>
        </div>
        <StatusPill tone={statusTone[cooldown.status]}>
          {cooldown.status === 'ready' ? 'Ready' : cooldown.status === 'cooling' ? 'Cooling' : 'Locked'}
        </StatusPill>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label="Cycle cooldown progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className={`h-full rounded-full transition-[width] ${cooldown.status === 'ready' ? 'bg-emerald-400' : 'bg-amber-400'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{cooldown.detail}</p>
    </div>
  )
}
