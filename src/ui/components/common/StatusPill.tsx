import type { ReactNode } from 'react'

interface StatusPillProps {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
}

const toneClasses: Record<NonNullable<StatusPillProps['tone']>, string> = {
  neutral: 'border-slate-600 bg-slate-800 text-slate-300',
  success: 'border-emerald-700/70 bg-emerald-950/70 text-emerald-300',
  warning: 'border-amber-700/70 bg-amber-950/60 text-amber-300',
  danger: 'border-rose-700/70 bg-rose-950/60 text-rose-300',
  accent: 'border-orange-700/70 bg-orange-950/60 text-orange-300',
}

export function StatusPill({ children, tone = 'neutral' }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}
