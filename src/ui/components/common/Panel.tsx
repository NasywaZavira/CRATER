import type { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  className?: string
  title?: string
  eyebrow?: string
  action?: ReactNode
}

export function Panel({ children, className = '', title, eyebrow, action }: PanelProps) {
  return (
    <section className={`rounded-2xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-lg shadow-black/10 ${className}`}>
      {(title || eyebrow || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">{eyebrow}</p>}
            {title && <h2 className="text-sm font-bold tracking-wide text-slate-100">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
