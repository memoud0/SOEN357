import { cn } from '../../lib/cn'

interface StepperProps {
  labels: string[]
  activeStep: number
}

export function Stepper({ labels, activeStep }: StepperProps) {
  return (
    <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Wizard progress">
      {labels.map((label, index) => {
        const isActive = index === activeStep
        const isDone = index < activeStep

        return (
          <li
            key={label}
            className={cn(
              'rounded-xl border px-3 py-2 text-xs transition',
              isDone && 'border-emerald-700 bg-emerald-950/40 text-emerald-300',
              isActive && 'border-brand-500 bg-brand-950/40 text-brand-200',
              !isDone && !isActive && 'border-slate-800 bg-slate-900/50 text-slate-400',
            )}
          >
            <span className="mr-1 font-semibold">{index + 1}.</span>
            {label}
          </li>
        )
      })}
    </ol>
  )
}
