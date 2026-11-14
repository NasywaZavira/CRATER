import { Panel } from './components/common/Panel'
import { StatusPill } from './components/common/StatusPill'
import { CycleCooldownIndicator } from './CycleCooldownIndicator'
import type { CycleCooldownViewModel, CycleViewModel } from './types/uiViewModel'

interface CycleHUDProps {
  day: number
  totalDays: number
  cycles: CycleViewModel[]
  cooldown: CycleCooldownViewModel
}

export function CycleHUD({ day, totalDays, cycles, cooldown }: CycleHUDProps) {
  return (
    <Panel title="Daily cycle" eyebrow="Mission timeline" className="h-full">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="text-slate-400">Day progression</span>
        <span className="font-bold text-slate-200">{day} of {totalDays}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${Math.min(100, Math.max(0, (day / totalDays) * 100))}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cycles.map((cycle) => (
          <div key={cycle.name} className={`rounded-xl border px-2 py-3 text-center ${cycle.status === 'current' ? 'border-orange-400/70 bg-orange-950/40' : cycle.status === 'complete' ? 'border-emerald-800 bg-emerald-950/30' : 'border-slate-700 bg-slate-950/50'}`}>
            <p className={`text-[10px] font-black uppercase tracking-wide ${cycle.status === 'current' ? 'text-orange-200' : cycle.status === 'complete' ? 'text-emerald-300' : 'text-slate-500'}`}>{cycle.label}</p>
            <div className="mt-2">
              <StatusPill tone={cycle.status === 'current' ? 'accent' : cycle.status === 'complete' ? 'success' : 'neutral'}>
                {cycle.status === 'current' ? 'Now' : cycle.status === 'complete' ? 'Done' : 'Next'}
              </StatusPill>
            </div>
          </div>
        ))}
      </div>
      <CycleCooldownIndicator cooldown={cooldown} />
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">Display only. Cycle transitions and cooldown state are supplied by the game engine.</p>
    </Panel>
  )
}
