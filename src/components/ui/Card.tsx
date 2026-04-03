import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export function Card({ className, elevated = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 backdrop-blur-sm',
        elevated && 'shadow-xl shadow-slate-950/70',
        className,
      )}
      {...props}
    />
  )
}
