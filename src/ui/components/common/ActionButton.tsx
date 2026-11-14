import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

const variants: Record<NonNullable<ActionButtonProps['variant']>, string> = {
  primary: 'border-orange-400 bg-orange-500 text-slate-950 hover:bg-orange-400',
  secondary: 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700',
  ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white',
  danger: 'border-rose-700 bg-rose-950 text-rose-200 hover:bg-rose-900',
}

export function ActionButton({ children, variant = 'secondary', fullWidth = false, className = '', ...props }: ActionButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
