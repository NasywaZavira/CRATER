import type { CrewMemberViewModel } from './types/uiViewModel'

interface CrewFallbackProps {
  crew: CrewMemberViewModel[]
}

export function CrewFallback({ crew }: CrewFallbackProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {crew.map((member, index) => (
        <div key={member.id} className="rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-left">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-xs font-black text-slate-200">{String(index + 1).padStart(2, '0')}</div>
          <p className="text-[11px] font-bold text-slate-100">{member.name}</p>
          <p className="mt-0.5 text-[9px] leading-snug text-slate-400">{member.role}</p>
          <p className={`mt-2 text-[9px] font-bold uppercase ${member.availability === 'available' ? 'text-emerald-300' : 'text-amber-300'}`}>{member.availability}</p>
        </div>
      ))}
    </div>
  )
}
