import { Panel } from './components/common/Panel'
import { StatusPill } from './components/common/StatusPill'
import type { CrewMemberViewModel } from './types/uiViewModel'

interface CrewSelectorProps {
  crew: CrewMemberViewModel[]
  selectedCrewIds: string[]
  maxSelectable: number
  onToggle: (crewId: string) => void
}

export function CrewSelector({ crew, selectedCrewIds, maxSelectable, onToggle }: CrewSelectorProps) {
  return (
    <Panel title="Assign crew" eyebrow="Crew selection" action={<StatusPill tone="accent">{selectedCrewIds.length}/{maxSelectable} selected</StatusPill>}>
      <div className="grid grid-cols-2 gap-2">
        {crew.map((member, index) => {
          const selected = selectedCrewIds.includes(member.id)
          const unavailable = member.availability === 'unavailable'
          const limitReached = !selected && selectedCrewIds.length >= maxSelectable
          const disabled = unavailable || limitReached
          return (
            <button
              key={member.id}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onToggle(member.id)}
              title={unavailable ? member.unavailableReason : undefined}
              className={`rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-orange-400 bg-orange-950/30' : 'border-slate-700 bg-slate-950/60 hover:border-slate-500'}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-[10px] font-black text-slate-200">{String(index + 1).padStart(2, '0')}</span>
                <StatusPill tone={unavailable ? 'warning' : selected ? 'accent' : 'success'}>{unavailable ? 'Unavailable' : selected ? 'Selected' : 'Available'}</StatusPill>
              </div>
              <p className="text-xs font-bold text-slate-100">{member.name}</p>
              <p className="mt-1 text-[10px] leading-snug text-slate-400">{member.role}</p>
              {unavailable && member.unavailableReason && <p className="mt-2 text-[9px] leading-snug text-amber-300">{member.unavailableReason}</p>}
              {limitReached && !unavailable && <p className="mt-2 text-[9px] text-slate-500">Selection limit reached.</p>}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">Eligibility and crew limits are supplied by the view model. The UI does not calculate traits, conflicts, or availability rules.</p>
    </Panel>
  )
}
