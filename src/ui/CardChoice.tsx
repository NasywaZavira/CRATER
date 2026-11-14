import { Panel } from './components/common/Panel'
import { MissionCard } from './MissionCard'
import type { MissionCardViewModel } from './types/uiViewModel'

interface CardChoiceProps {
  cards: MissionCardViewModel[]
  selectedCardId: string | null
  onSelect: (cardId: string) => void
}

export function CardChoice({ cards, selectedCardId, onSelect }: CardChoiceProps) {
  return (
    <Panel title="Choose a mission" eyebrow="Mission hand" action={<span className="text-[10px] text-slate-500">{cards.length} options</span>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <MissionCard key={card.id} card={card} selected={selectedCardId === card.id} onSelect={onSelect} />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-500">UI selects from the supplied hand. Card filtering and drawing remain in the engine.</p>
    </Panel>
  )
}
