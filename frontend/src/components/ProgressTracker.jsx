const STEPS = [
  { key: 'salary_1', label: 'Salary data — Country 1' },
  { key: 'salary_2', label: 'Salary data — Country 2' },
  { key: 'tax_1',    label: 'Tax policy — Country 1' },
  { key: 'tax_2',    label: 'Tax policy — Country 2' },
]

export default function ProgressTracker({ steps }) {
  const active = new Set(steps.filter(s => s.status === 'active').map(s => s.step))
  const done   = new Set(steps.filter(s => s.status === 'done').map(s => s.step))

  return (
    <div className="space-y-3">
      {STEPS.map((s, i) => {
        const isDone   = done.has(s.key)
        const isActive = !isDone && active.has(s.key)

        return (
          <div key={s.key} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 border
              ${isDone   ? 'bg-mint text-ink-950 border-mint' :
                isActive ? 'border-gold text-gold animate-pulse' :
                           'border-white/10 text-slate-500'}`}>
              {isDone ? '✓' : i + 1}
            </div>
            <span className={`text-sm
              ${isDone   ? 'text-mint' :
                isActive ? 'text-white' :
                           'text-slate-500'}`}>
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
