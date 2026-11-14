import { Panel } from './components/common/Panel'
import { StatusPill } from './components/common/StatusPill'
import type { JournalEntryViewModel, NasaFactViewModel } from './types/uiViewModel'

interface DayJournalProps {
  day: number
  entries: JournalEntryViewModel[]
  nasaFact: NasaFactViewModel
}

export function DayJournal({ day, entries, nasaFact }: DayJournalProps) {
  return (
    <Panel title="Daily journal" eyebrow={`Day ${day} record`}>
      <div className="space-y-3">
        {entries.map((entry) => (
          <article key={entry.id} className="border-l-2 border-slate-700 pl-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-orange-300">{entry.cycleLabel}</p>
            <h3 className="mt-1 text-xs font-bold text-slate-100">{entry.decisionTitle}</h3>
            <p className="mt-1 text-[10px] text-slate-500">Crew: {entry.crewLabels.length ? entry.crewLabels.join(', ') : 'Not supplied'}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.resourceDeltas.map((delta) => (
                <span key={delta.id} className="rounded-md bg-slate-800 px-2 py-1 text-[9px] text-slate-400">{delta.label}: {delta.delta > 0 ? '+' : ''}{delta.delta}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">NASA reference</p>
          <StatusPill tone="neutral">{nasaFact.mode}</StatusPill>
        </div>
        <h3 className="text-xs font-bold text-slate-100">{nasaFact.title}</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{nasaFact.summary}</p>
        <p className="mt-2 text-[9px] text-slate-500">{nasaFact.sourceTitle}</p>
        {nasaFact.sourceUrl ? (
          <a href={nasaFact.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-[10px] font-semibold text-orange-300 underline decoration-orange-500/40 underline-offset-2">Open source ↗</a>
        ) : (
          <p className="mt-2 text-[9px] text-amber-300">Source URL pending verified handoff.</p>
        )}
        {nasaFact.dateAccessed && <p className="mt-1 text-[9px] text-slate-600">Accessed: {nasaFact.dateAccessed}</p>}
      </div>
    </Panel>
  )
}
