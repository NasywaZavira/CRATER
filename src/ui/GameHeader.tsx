import { StatusPill } from './components/common/StatusPill'
import { MarsClockHUD } from './MarsClockHUD'
import { TopResourceRail } from './TopResourceRail'
import type { ResourceViewModel } from './types/uiViewModel'

interface GameHeaderProps {
  day: number
  totalDays: number
  cycleLabel: string
  resources: ResourceViewModel[]
}

const RESOURCE_LEGEND = [
  { label: 'Shielding', color: 'var(--enam-shielding-accent)' },
  { label: 'Food', color: 'var(--enam-food-primary)' },
  { label: 'Life Support', color: 'var(--enam-life-support-primary)' },
  { label: 'Power', color: 'var(--enam-power-primary)' },
]

export function GameHeader({ day, totalDays, cycleLabel, resources }: GameHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-500/70 bg-slate-900/90 p-3 shadow-xl shadow-black/25 backdrop-blur sm:p-4">
      <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[124px_minmax(0,1fr)] sm:gap-4">
        <MarsClockHUD missionDay={day} totalMissionDays={totalDays} />

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-300/30 bg-orange-500 text-sm font-black text-slate-950 shadow-lg shadow-orange-950/30">E</span>
              <div className="min-w-0">
                <p className="text-lg font-black tracking-[0.16em] text-white">ENAM</p>
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-400">Mars survival project</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-600/70 bg-slate-950/60 px-2.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.16em] text-slate-500">Current cycle</p>
                <p className="text-xs font-bold text-slate-100">{cycleLabel}</p>
              </div>
              <StatusPill tone="accent">Live</StatusPill>
            </div>
          </div>

          <div className="border-t border-slate-700/80 pt-2.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">Life-support systems monitor</span>
              <span className="text-[7px] font-semibold uppercase tracking-[0.14em] text-slate-600">Resource signal rails</span>
            </div>
            <TopResourceRail resources={resources} />
            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
              {RESOURCE_LEGEND.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-widest text-slate-400">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
