import type { ResourceViewModel } from './types/uiViewModel'

// The order deliberately follows the coloured reference stripes: violet, green, cyan, yellow.
const RESOURCE_RAILS = [
  { id: 'shielding', label: 'Shielding', primary: 'var(--enam-shielding-primary)', accent: 'var(--enam-shielding-accent)' },
  { id: 'food', label: 'Food', primary: 'var(--enam-food-primary)', accent: 'var(--enam-food-accent)' },
  { id: 'life-support', label: 'Life Support', primary: 'var(--enam-life-support-primary)', accent: 'var(--enam-life-support-accent)' },
  { id: 'power', label: 'Power', primary: 'var(--enam-power-primary)', accent: 'var(--enam-power-accent)' },
] as const

interface TopResourceRailProps {
  resources: ResourceViewModel[]
}

export function TopResourceRail({ resources }: TopResourceRailProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-[5px]" aria-label="Top resource status indicators">
      {RESOURCE_RAILS.map((rail) => {
        const resource = resources.find((item) => item.id === rail.id)
        const value = resource?.value ?? 0
        const max = resource?.max ?? 100
        const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
        return (
          <div key={rail.id} className="relative h-[10px] overflow-hidden rounded-full border border-slate-600/45 bg-slate-700/65" title={`${rail.label}: ${value}/${max}`} role="progressbar" aria-label={rail.label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${percent}%`,
                background: `linear-gradient(90deg, ${rail.primary}, ${rail.accent})`,
                boxShadow: `0 0 8px color-mix(in srgb, ${rail.primary} 38%, transparent)`,
              }}
            />
            <span className="sr-only">{rail.label}: {value} of {max}</span>
          </div>
        )
      })}
    </div>
  )
}
