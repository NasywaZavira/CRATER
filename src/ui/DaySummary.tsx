import { Panel } from './components/common/Panel'
import { ResourceDelta } from './ResourceDelta'
import type { DaySummaryViewModel } from './types/uiViewModel'

interface DaySummaryProps {
  summary: DaySummaryViewModel
  onNextDay?: () => void
}

export function DaySummary({ summary, onNextDay }: DaySummaryProps) {
  return (
    <Panel title={`Day ${summary.day} summary`} eyebrow="Daily recap">
      <ol className="space-y-2">
        {summary.decisions.map((decision, index) => (
          <li key={`${summary.day}-${index}`} className="flex gap-2 text-xs text-slate-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[9px] font-bold text-orange-300">{index + 1}</span>
            <span className="leading-relaxed">{decision}</span>
          </li>
        ))}
      </ol>
      <div className="my-4 border-t border-slate-700 pt-4">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Resource changes</p>
        <ResourceDelta items={summary.resourceDeltas} />
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">{summary.note}</p>
      {onNextDay && <button type="button" onClick={onNextDay} className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700">Next day (engine action)</button>}
    </Panel>
  )
}
