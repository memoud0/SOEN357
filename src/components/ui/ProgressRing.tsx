import { motion } from 'framer-motion'

interface ProgressRingProps {
  value: number
  size?: number
  stroke?: number
  label?: string
}

export function ProgressRing({ value, size = 112, stroke = 10, label }: ProgressRingProps) {
  const normalized = Math.min(100, Math.max(0, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (normalized / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-slate-800 fill-transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-transparent stroke-emerald-400"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-slate-100">{normalized}%</span>
        {label ? <span className="text-[10px] tracking-wide text-slate-400">{label}</span> : null}
      </div>
    </div>
  )
}
