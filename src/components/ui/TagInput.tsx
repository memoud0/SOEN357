import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './Button'
import { Chip } from './Chip'

interface TagInputProps {
  label: string
  placeholder?: string
  values: string[]
  helper?: string
  onChange: (next: string[]) => void
}

export function TagInput({ label, placeholder, values, helper, onChange }: TagInputProps) {
  const [input, setInput] = useState('')

  const commitInput = () => {
    const clean = input.trim()
    if (!clean) {
      return
    }

    if (!values.includes(clean)) {
      onChange([...values, clean])
    }
    setInput('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200">{label}</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitInput()
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        />
        <Button variant="secondary" onClick={commitInput}>
          Add
        </Button>
      </div>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Chip key={value} className="gap-1 pr-1">
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="rounded-full p-0.5 hover:bg-slate-700/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-300"
              aria-label={`Remove ${value}`}
            >
              <X size={12} />
            </button>
          </Chip>
        ))}
      </div>
    </div>
  )
}
