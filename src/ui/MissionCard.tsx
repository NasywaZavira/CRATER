import { StatusPill } from './components/common/StatusPill'
import type { MissionCardViewModel } from './types/uiViewModel'

interface MissionCardProps {
  card: MissionCardViewModel
  selected: boolean
  onSelect: (cardId: string) => void
  disabled?: boolean
}

const categoryLabels: Record<MissionCardViewModel['category'], string> = {
  research: 'Research',
  construction: 'Construction',
  repair: 'Repair',
  operations: 'Operations',
}

export function MissionCard({ card, selected, onSelect, disabled = false }: MissionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(card.id)}
      className={`flex h-full min-h-44 w-full flex-col rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-orange-400 bg-orange-950/30 shadow-lg shadow-orange-950/20' : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 hover:bg-slate-800/80'}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <StatusPill tone={selected ? 'accent' : 'neutral'}>{categoryLabels[card.category]}</StatusPill>
        <span className="text-[9px] font-mono text-slate-500">{card.id}</span>
      </div>
      <h3 className="text-sm font-bold leading-snug text-slate-100">{card.title}</h3>
      <p className="mt-2 flex-1 text-[11px] leading-relaxed text-slate-400">{card.description}</p>
      <div className="mt-3 border-t border-slate-700/80 pt-2">
        <p className="text-[10px] leading-relaxed text-slate-500">{card.tradeoff}</p>
        <p className={`mt-2 text-[10px] font-bold ${selected ? 'text-orange-300' : 'text-slate-400'}`}>{selected ? 'Selected' : 'Tap to select'}</p>
      </div>
    </button>
  )
}
