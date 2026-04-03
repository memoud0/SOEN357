import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white shadow-lg shadow-brand-900/30 hover:bg-brand-400 focus-visible:ring-brand-300',
  secondary:
    'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 focus-visible:ring-slate-400',
  ghost:
    'bg-transparent text-slate-200 hover:bg-slate-800/60 border border-slate-700/70 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-300',
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
