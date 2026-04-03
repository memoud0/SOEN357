import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

const toneMap: Record<NonNullable<ChipProps['tone']>, string> = {
  default: 'bg-slate-800 text-slate-200 border-slate-700',
  success: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70',
  warning: 'bg-amber-950/70 text-amber-300 border-amber-800/70',
  danger: 'bg-rose-950/70 text-rose-300 border-rose-800/70',
}

export function Chip({ className, tone = 'default', ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide',
        toneMap[tone],
        className,
      )}
      {...props}
    />
  )
}
