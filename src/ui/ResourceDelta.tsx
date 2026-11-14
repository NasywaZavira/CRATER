import type { ResourceDeltaViewModel } from './types/uiViewModel'

interface ResourceDeltaProps {
  items: ResourceDeltaViewModel[]
}

export function ResourceDelta({ items }: ResourceDeltaProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const positive = item.delta > 0
        const negative = item.delta < 0
        const tone = positive ? 'text-emerald-300' : negative ? 'text-rose-300' : 'text-slate-400'
        const symbol = positive ? '+' : ''
        return (
          <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/80 bg-slate-950/50 px-3 py-2">
            <span className="truncate text-[10px] text-slate-400">{item.label}</span>
            <span className={`text-xs font-black tabular-nums ${tone}`}>{symbol}{item.delta}</span>
          </div>
        )
      })}
    </div>
  )
}
