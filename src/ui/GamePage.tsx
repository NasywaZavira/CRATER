import { useCallback, useMemo, useState } from 'react'
import { ActionButton } from './components/common/ActionButton'
import { Panel } from './components/common/Panel'
import { StatusPill } from './components/common/StatusPill'
import { CardChoice } from './CardChoice'
import { CrewSelector } from './CrewSelector'
import { CycleHUD } from './CycleHUD'
import { DayJournal } from './DayJournal'
import { EarthCommsHUD } from './EarthCommsHUD'
import { DaySummary } from './DaySummary'
import { GameHeader } from './GameHeader'
import { NoeDialogue } from './NoeDialogue'
import { ResourceHUD } from './ResourceHUD'
import { SceneSlot } from './SceneSlot'
import { TimedEvent } from './TimedEvent'
import { mockGameViewModel } from './fixtures/mockGameViewModel'
import type { UiGameActions, UiGameViewModel } from './types/uiViewModel'

const EMPTY_UI_ACTIONS: UiGameActions = {}

interface GamePageProps {
  /** Provisional UI view model; map the official contract to this shape in an adapter. */
  viewModel?: UiGameViewModel
  /** Translate these UI intents to official GameAction dispatches in the integration layer. */
  actions?: UiGameActions
}

export function GamePage({ viewModel = mockGameViewModel, actions = EMPTY_UI_ACTIONS }: GamePageProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([])
  const [eventOpen, setEventOpen] = useState(false)
  const [eventInstance, setEventInstance] = useState(0)
  const [contactPending, setContactPending] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [notice, setNotice] = useState('Preview mode: values are supplied by local fixtures.')

  const selectedCard = useMemo(
    () => viewModel.cards.find((card) => card.id === selectedCardId) ?? null,
    [viewModel.cards, selectedCardId],
  )
  const crewLimit = selectedCard?.crewLimit ?? 1

  function selectCard(cardId: string) {
    if (selectedCardId === cardId) return
    setSelectedCardId(cardId)
    setSelectedCrewIds([])
    setNotice(`Selected ${cardId}. Select eligible crew before confirming.`)
    actions.onSelectCard?.(cardId)
  }

  function toggleCrew(crewId: string) {
    const member = viewModel.crew.find((item) => item.id === crewId)
    if (!member || member.availability !== 'available') return

    setSelectedCrewIds((current) => {
      if (current.includes(crewId)) return current.filter((id) => id !== crewId)
      if (current.length >= crewLimit) return current
      return [...current, crewId]
    })
  }

  function confirmAssignment() {
    if (!selectedCard || selectedCrewIds.length === 0) return
    actions.onAssignCrew?.(selectedCard.id, selectedCrewIds)
    setNotice(`UI intent emitted for ${selectedCard.id}. The game engine owns the result.`)
  }

  const onSceneHostReady = actions.onSceneHostReady
  const handleSceneHost = useCallback((element: HTMLDivElement | null) => {
    onSceneHostReady?.(element)
  }, [onSceneHostReady])

  function openEventPreview() {
    setContactPending(false)
    setEventInstance((instance) => instance + 1)
    setEventOpen(true)
  }

  function contactEarth() {
    setContactPending(true)
    actions.onContactEarth?.(viewModel.timedEvent.id)
  }

  function handleEventTimeout(fallbackOptionId: string) {
    actions.onEventTimeout?.(viewModel.timedEvent.id, fallbackOptionId)
    setNotice('Event timeout fallback emitted once.')
    setEventOpen(false)
  }

  function handleEventChoice(optionId: string) {
    actions.onChooseEvent?.(viewModel.timedEvent.id, optionId)
    setNotice(`Event response ${optionId} emitted to the integration layer.`)
  }

  return (
    <main className="enam-game-backdrop min-h-screen px-3 py-4 pb-28 text-slate-100 sm:px-5 sm:py-6 sm:pb-28">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <GameHeader day={viewModel.day} totalDays={viewModel.totalDays} cycleLabel={viewModel.cycleLabel} resources={viewModel.resources} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <CycleHUD day={viewModel.day} totalDays={viewModel.totalDays} cycles={viewModel.cycles} cooldown={viewModel.cycleCooldown}/>
            <SceneSlot status={viewModel.sceneStatus} crew={viewModel.crew} mountRef={handleSceneHost} />
            <CardChoice cards={viewModel.cards} selectedCardId={selectedCardId} onSelect={selectCard} />
            <CrewSelector crew={viewModel.crew} selectedCrewIds={selectedCrewIds} maxSelectable={crewLimit} onToggle={toggleCrew} />
            <Panel title="Mission assignment" eyebrow="UI intent" className="border-orange-800/50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100">{selectedCard?.title ?? 'Select a mission card first'}</p>
                  <p className="mt-1 text-[10px] text-slate-500">Selected crew: {selectedCrewIds.length ? selectedCrewIds.length : 'none'}</p>
                </div>
                <ActionButton variant="primary" disabled={!selectedCard || selectedCrewIds.length === 0} onClick={confirmAssignment}>Confirm selection</ActionButton>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-500">This button emits UI intent only. The engine validates and resolves the action.</p>
            </Panel>
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            <ResourceHUD resources={viewModel.resources} deltas={viewModel.resourceDeltas} />
            <NoeDialogue message={viewModel.noeMessage} onPreviewEvent={openEventPreview} />
            <Panel title="Integration status" eyebrow="Developer preview">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="success">React UI mounted</StatusPill>
                <StatusPill tone={viewModel.sceneStatus === 'ready' ? 'success' : 'warning'}>{viewModel.sceneStatus === 'ready' ? 'Phaser ready' : 'Phaser fallback'}</StatusPill>
                <StatusPill tone="neutral">Mock view model</StatusPill>
              </div>
              <p role="status" aria-live="polite" className="mt-3 text-[10px] leading-relaxed text-slate-400">{notice}</p>
            </Panel>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton variant="secondary" onClick={() => setSummaryOpen((open) => !open)}>{summaryOpen ? 'Hide summary' : 'Preview summary'}</ActionButton>
              <ActionButton variant="secondary" onClick={openEventPreview}>Open event modal</ActionButton>
            </div>
            {summaryOpen && <DaySummary summary={viewModel.daySummary} onNextDay={actions.onNextDay} />}
            <DayJournal day={viewModel.day} entries={viewModel.journalEntries} nasaFact={viewModel.nasaFact} />
          </aside>
        </div>

        <footer className="flex flex-col gap-1 border-t border-slate-800 pt-3 text-[9px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>ENAM · Alip React UI foundation</span>
          <div className="flex flex-wrap items-center gap-3">
            <span>Mock content only · Awaiting official contracts, content, and visual assets</span>
            {actions.onRestart && <button type="button" onClick={actions.onRestart} className="font-bold text-slate-400 underline underline-offset-2 hover:text-white">Restart</button>}
          </div>
        </footer>
      </div>

      <EarthCommsHUD
        onOpen={() => {
          actions.onOpenEarthComms?.()
          setNotice('Earth communications console opened. Preview only; no signal has been transmitted.')
        }}
        onRequestContact={() => {
          actions.onRequestEarthContact?.()
          setNotice('Earth contact request staged in the UI. Awaiting the official communications action.')
        }}
      />

      <TimedEvent
        key={`${viewModel.timedEvent.id}-${eventInstance}`}
        event={viewModel.timedEvent}
        isOpen={eventOpen}
        onChoose={handleEventChoice}
        onTimeout={handleEventTimeout}
        onContactEarth={contactEarth}
        contactPending={contactPending}
        onClose={() => setEventOpen(false)}
      />
    </main>
  )
}
