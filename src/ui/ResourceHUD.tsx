import { IconifyIcon } from './IconifyIcon'
import { Panel } from './components/common/Panel'
import { ResourceDelta } from './ResourceDelta'
import type { ResourceDeltaViewModel, ResourceViewModel } from './types/uiViewModel'

interface ResourceHUDProps {
  resources: ResourceViewModel[]
  deltas: ResourceDeltaViewModel[]
}

const RESOURCE_THEME: Record<string, { primary: string; accent: string; icon: string }> = {
  'life-support': { primary: 'var(--enam-life-support-primary)', accent: 'var(--enam-life-support-accent)', icon: 'mdi:air-filter' },
  shielding: { primary: 'var(--enam-shielding-primary)', accent: 'var(--enam-shielding-accent)', icon: 'mdi:shield-outline' },
  power: { primary: 'var(--enam-power-primary)', accent: 'var(--enam-power-accent)', icon: 'mdi:lightning-bolt' },
  food: { primary: 'var(--enam-food-primary)', accent: 'var(--enam-food-accent)', icon: 'mdi:food-apple-outline' },
}

const FALLBACK_THEME = { primary: '#94A3B8', accent: '#64748B', icon: 'mdi:chart-bar' }

export function ResourceHUD({ resources, deltas }: ResourceHUDProps) {
  return (
    <Panel title="Survival resources" eyebrow="Status monitor" className="border-slate-600/70">
      <div className="space-y-4">
        {resources.map((resource) => {
          const percent = resource.max > 0 ? Math.min(100, Math.max(0, (resource.value / resource.max) * 100)) : 0
          const theme = RESOURCE_THEME[resource.id] ?? FALLBACK_THEME
          return (
            <div key={resource.id}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-200">
                  <IconifyIcon icon={theme.icon} size={15} className="shrink-0" />
                  <span className="truncate">{resource.label}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">{resource.value}/{resource.max}</span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full border border-slate-700/70 bg-slate-800"
                role="progressbar"
                aria-label={resource.label}
                aria-valuemin={0}
                aria-valuemax={resource.max}
                aria-valuenow={resource.value}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${percent}%`,
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
                    boxShadow: `0 0 10px color-mix(in srgb, ${theme.primary} 32%, transparent)`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-5 border-t border-slate-700 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Latest delta</h3>
          <span className="text-[9px] text-slate-600">From view model</span>
        </div>
        <ResourceDelta items={deltas} />
      </div>
    </Panel>
  )
}
