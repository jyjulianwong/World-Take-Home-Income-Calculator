import { useState } from 'react'
import CurrencyConverter from './CurrencyConverter'

function fmt(symbol, amount) {
  return `${symbol}${amount.toLocaleString()}`
}

function TaxBreakdown({ symbol, deductions }) {
  return (
    <div className="mt-4 space-y-1.5">
      {deductions.map((d, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-slate-400">{d.name}</span>
          <span className="text-red-400 font-medium">− {fmt(symbol, d.amount)}</span>
        </div>
      ))}
    </div>
  )
}

function CountryCard({ data, highlight }) {
  const { name, currency_symbol: sym, gross_annual, gross_monthly, salary_data, tax } = data
  const confidenceBadge = {
    high: 'bg-emerald-900 text-emerald-300',
    medium: 'bg-amber-900 text-amber-300',
    low: 'bg-red-900 text-red-300',
  }[salary_data.confidence] ?? 'bg-slate-700 text-slate-300'

  return (
    <div className={`rounded-2xl border p-6 flex flex-col gap-4 ${highlight ? 'border-indigo-500 bg-indigo-950/40' : 'border-slate-700 bg-slate-800/50'}`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xl font-bold text-white">{name}</h2>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${confidenceBadge}`}>
          {salary_data.confidence} confidence
        </span>
      </div>

      {/* Gross */}
      <div className="rounded-xl bg-slate-800 p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Gross Annual</p>
        <p className="text-2xl font-bold text-white">{fmt(sym, gross_annual)}</p>
        <p className="text-sm text-slate-400">{fmt(sym, gross_monthly)} / month</p>
        {salary_data.range_min && salary_data.range_max && (
          <p className="text-xs text-slate-500 mt-1">
            Range: {fmt(sym, salary_data.range_min)} – {fmt(sym, salary_data.range_max)}
          </p>
        )}
      </div>

      {/* Deductions */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Deductions</p>
        <TaxBreakdown symbol={sym} deductions={tax.deductions} />
        <div className="border-t border-slate-700 mt-3 pt-3 flex justify-between text-sm font-semibold">
          <span className="text-slate-300">Total deducted</span>
          <span className="text-red-400">− {fmt(sym, tax.total_deductions)}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Effective rate: {(tax.effective_tax_rate * 100).toFixed(1)}%
        </p>
      </div>

      {/* Take-home */}
      <div className={`rounded-xl p-4 ${highlight ? 'bg-indigo-600' : 'bg-emerald-900/50 border border-emerald-700'}`}>
        <p className="text-xs text-white/70 uppercase tracking-wider mb-1">Take-Home Annual</p>
        <p className="text-3xl font-extrabold text-white">{fmt(sym, tax.take_home_annual)}</p>
        <p className="text-base text-white/80 font-semibold">{fmt(sym, tax.take_home_monthly)} / month</p>
      </div>

      {/* Notes */}
      {(tax.region_assumption !== 'N/A' || tax.notes) && (
        <p className="text-xs text-slate-500 leading-relaxed">
          {tax.region_assumption !== 'N/A' && <span>Region: {tax.region_assumption}. </span>}
          {tax.notes}
        </p>
      )}

      {/* Sources */}
      {salary_data.sample_data_points?.length > 0 && (
        <details className="text-xs text-slate-500 cursor-pointer">
          <summary className="hover:text-slate-300 transition-colors">Data sources</summary>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            {salary_data.sample_data_points.map((dp, i) => (
              <li key={i}>
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
        </details>
      )}
    </div>
  )
}

export default function ResultsDisplay({ results }) {
  const [highlightIdx, setHighlightIdx] = useState(null)
  const [a, b] = results.countries

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-slate-400 text-sm">Results for</p>
        <h1 className="text-xl font-bold text-white">{results.job_role}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CountryCard data={a} highlight={highlightIdx === 0} />
        <CountryCard data={b} highlight={highlightIdx === 1} />
      </div>
      <CurrencyConverter countries={results.countries} onWinnerChange={setHighlightIdx} />

      <p className="text-center text-xs text-slate-500">
        Estimates based on publicly available salary data and current tax policies. Individual circumstances may vary.
      </p>
    </div>
  )
}
