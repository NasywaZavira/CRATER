import { Panel } from './components/common/Panel'
import { ActionButton } from './components/common/ActionButton'

interface NoeDialogueProps {
  message: string
  onPreviewEvent?: () => void
}

export function NoeDialogue({ message, onPreviewEvent }: NoeDialogueProps) {
  return (
    <Panel title="Noe" eyebrow="Mission companion" action={<span className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-400/40 bg-orange-950/50 text-xs font-black text-orange-200">N</span>}>
      <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <p className="text-xs leading-relaxed text-slate-300">{message}</p>
      </div>
      {onPreviewEvent && <ActionButton className="mt-3" fullWidth variant="secondary" onClick={onPreviewEvent}>Preview timed event</ActionButton>}
      <p className="mt-2 text-[9px] text-slate-600">Dialogue content is supplied by the UI view model; NASA facts are displayed separately with their source.</p>
    </Panel>
  )
}
