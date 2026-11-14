/**
 * UI-only view model for Alip's React screens.
 *
 * IMPORTANT:
 * This is a provisional presentation contract, not the official ENAM
 * GameViewModel/GameState. When A publishes src/contracts, create a mapper
 * inside src/ui/adapters that converts the official contract into this shape.
 * Do not put gameplay rules, resource formulas, RNG, or cycle transitions here.
 */

export type CycleName = 'morning' | 'afternoon' | 'night'
export type CycleStatus = 'complete' | 'current' | 'upcoming'
export type CardCategory = 'research' | 'construction' | 'repair' | 'operations'
export type CrewAvailability = 'available' | 'unavailable'
export type SceneStatus = 'placeholder' | 'ready' | 'failed'
export type CycleCooldownStatus = 'ready' | 'cooling' | 'locked'

export interface CycleViewModel {
  name: CycleName
  label: string
  status: CycleStatus
}

/** Display-only cooldown state supplied by the game/preview model. */
export interface CycleCooldownViewModel {
  status: CycleCooldownStatus
  label: string
  /** Completion percentage supplied by the model; UI does not run a timer. */
  progressPercent: number
  detail: string
}

export interface MissionCardViewModel {
  id: string
  title: string
  description: string
  category: CardCategory
  tradeoff: string
  /** Provided by the official content/engine contract; UI does not infer this. */
  crewLimit: 1 | 2
}

export interface CrewMemberViewModel {
  id: string
  name: string
  role: string
  availability: CrewAvailability
  unavailableReason?: string
}

export interface ResourceViewModel {
  id: 'life-support' | 'shielding' | 'power' | 'food' | string
  label: string
  value: number
  max: number
  delta?: number
}

export interface ResourceDeltaViewModel {
  id: string
  label: string
  delta: number
}

export interface NasaFactViewModel {
  id: string
  title: string
  summary: string
  sourceTitle: string
  sourceUrl?: string
  dateAccessed?: string
  mode: 'archived' | 'static'
}

export interface JournalEntryViewModel {
  id: string
  cycle: CycleName
  cycleLabel: string
  decisionTitle: string
  crewLabels: string[]
  resourceDeltas: ResourceDeltaViewModel[]
}

export interface DaySummaryViewModel {
  day: number
  decisions: string[]
  resourceDeltas: ResourceDeltaViewModel[]
  note: string
}

export interface TimedEventOptionViewModel {
  id: string
  title: string
  description: string
}

export interface TimedEventViewModel {
  id: string
  title: string
  description: string
  durationSeconds: number
  options: TimedEventOptionViewModel[]
  timeoutChoiceId: string
}

export interface UiGameViewModel {
  day: number
  totalDays: number
  cycle: CycleName
  cycleLabel: string
  cycles: CycleViewModel[]
  cycleCooldown: CycleCooldownViewModel
  cards: MissionCardViewModel[]
  crew: CrewMemberViewModel[]
  resources: ResourceViewModel[]
  resourceDeltas: ResourceDeltaViewModel[]
  sceneStatus: SceneStatus
  noeMessage: string
  nasaFact: NasaFactViewModel
  journalEntries: JournalEntryViewModel[]
  daySummary: DaySummaryViewModel
  timedEvent: TimedEventViewModel
}

/**
 * UI emits intent through these callbacks. The integration layer owned by A
 * should translate each callback into the official GameAction/dispatch call.
 */
export interface UiGameActions {
  onSelectCard?: (cardId: string) => void
  onAssignCrew?: (cardId: string, crewIds: string[]) => void
  onChooseEvent?: (eventId: string, optionId: string) => void
  onEventTimeout?: (eventId: string, fallbackOptionId: string) => void
  onContactEarth?: (eventId: string) => void
  onSceneHostReady?: (element: HTMLDivElement | null) => void
  onRestart?: () => void
  onNextDay?: () => void

  // Earth communication UI intents
  onOpenEarthComms?: () => void
  onRequestEarthContact?: () => void
}
