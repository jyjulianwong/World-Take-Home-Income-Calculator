function fmt(symbol, amount) {
  return `${symbol}${Number(amount).toLocaleString()}`
}

const CONFIDENCE_STYLE = {
  high:   'bg-emerald-900 text-emerald-300',
  medium: 'bg-amber-900 text-amber-300',
  low:    'bg-red-900 text-red-300',
}

function SalaryCard({ countryName, data }) {
  const sym = data.currency_symbol || ''
  const style = CONFIDENCE_STYLE[data.confidence] ?? 'bg-slate-700 text-slate-300'

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-semibold text-white">
          Salary data · <span className="text-indigo-300">{countryName}</span>
        </p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style}`}>
          {data.confidence} confidence
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Average', value: data.average },
          { label: 'Median',  value: data.median  },
          { label: 'Range',   value: (data.range_min && data.range_max)
              ? `${fmt(sym, data.range_min)}–${fmt(sym, data.range_max)}`
              : null },
        ].map(({ label, value }) => value != null && (
          <div key={label} className="rounded-lg bg-slate-900 px-2 py-2">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {label === 'Range' ? value : fmt(sym, value)}
            </p>
          </div>
        ))}
      </div>

      {data.sample_data_points?.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-1">Sources</p>
          <ul className="space-y-0.5">
            {data.sample_data_points.map((dp, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-1.5 before:content-['·'] before:text-slate-600">
                {typeof dp === 'string' ? dp : (
                  <>
                    <a href={dp.url} target="_blank" rel="noopener noreferrer"
                       className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                      {dp.source}
                    </a>
                    : {dp.figure}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.notes && (
        <p className="text-xs text-slate-500 italic">{data.notes}</p>
      )}
    </div>
  )
}

function TaxCard({ countryName, data, currencySymbol }) {
  const sym = currencySymbol || ''

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3">
      <p className="text-sm font-semibold text-white">
        Tax breakdown · <span className="text-indigo-300">{countryName}</span>
        {data.region_assumption && data.region_assumption !== 'N/A' && (
          <span className="text-slate-400 font-normal"> ({data.region_assumption})</span>
        )}
      </p>

      <div className="space-y-1">
        {data.deductions?.map((d, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-slate-400">{d.name}</span>
            <span className="text-red-400 font-medium">− {fmt(sym, d.amount)}</span>
          </div>
        ))}
        <div className="border-t border-slate-700 pt-1 mt-1 flex justify-between text-xs font-semibold">
          <span className="text-slate-300">Total deducted</span>
          <span className="text-red-400">− {fmt(sym, data.total_deductions)}</span>
        </div>
      </div>

      <div className="rounded-lg bg-slate-900 px-3 py-2 flex justify-between items-center">
        <p className="text-xs text-slate-400">Take-home</p>
        <div className="text-right">
          <p className="text-sm font-bold text-emerald-400">{fmt(sym, data.take_home_annual)} / yr</p>
          <p className="text-xs text-slate-400">{fmt(sym, data.take_home_monthly)} / mo</p>
        </div>
      </div>

      {data.notes && (
        <p className="text-xs text-slate-500 italic">{data.notes}</p>
      )}
    </div>
  )
}

// step ordering for display
const STEP_ORDER = [
  { key: 'salary_1', type: 'salary', countryKey: 'country1' },
  { key: 'salary_2', type: 'salary', countryKey: 'country2' },
  { key: 'tax_1',    type: 'tax',    countryKey: 'country1', salaryKey: 'salary_1' },
  { key: 'tax_2',    type: 'tax',    countryKey: 'country2', salaryKey: 'salary_2' },
]

export default function StepOutput({ submittedForm, intermediateData }) {
  const completed = STEP_ORDER.filter(s => intermediateData[s.key])
  if (!completed.length) return null

  return (
    <div className="space-y-3">
      {completed.map(step => {
        const data = intermediateData[step.key]
        const countryName = submittedForm?.[step.countryKey] ?? ''
        if (step.type === 'salary') {
          return <SalaryCard key={step.key} countryName={countryName} data={data} />
        }
        const currencySymbol = intermediateData[step.salaryKey]?.currency_symbol ?? ''
        return <TaxCard key={step.key} countryName={countryName} data={data} currencySymbol={currencySymbol} />
      })}
    </div>
  )
}
