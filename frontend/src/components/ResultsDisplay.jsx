import { useState } from 'react'
import CurrencyConverter from './CurrencyConverter'
import RevealOnScroll from './RevealOnScroll'
import { useSpotlight } from '../hooks/useSpotlight'

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

function CountryCard({ data, highlight, onPointerMove }) {
  const { name, currency_symbol: sym, gross_annual, gross_monthly, salary_data, tax } = data
  const confidenceBadge = {
    high: 'bg-mint/15 text-mint',
    medium: 'bg-amber-900/60 text-amber-300',
    low: 'bg-red-950/60 text-red-300',
  }[salary_data.confidence] ?? 'bg-white/10 text-slate-300'

  return (
    <div
      onPointerMove={onPointerMove}
      className={`glass spotlight rounded-2xl p-6 flex flex-col gap-4 ${highlight ? 'border-gold/40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-serif text-xl font-bold text-white">{name}</h2>
        <span className={`font-mono text-xs font-semibold px-2 py-1 rounded-full ${confidenceBadge}`}>
          {salary_data.confidence} confidence
        </span>
      </div>

      {/* Gross */}
      <div className="rounded-xl bg-white/5 p-4">
        <p className="font-mono text-xs text-slate-400 uppercase tracking-wider mb-1">Gross Annual</p>
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
        <p className="font-mono text-xs text-slate-400 uppercase tracking-wider mb-1">Deductions</p>
        <TaxBreakdown symbol={sym} deductions={tax.deductions} />
        <div className="border-t border-white/10 mt-3 pt-3 flex justify-between text-sm font-semibold">
          <span className="text-slate-300">Total deducted</span>
          <span className="text-red-400">− {fmt(sym, tax.total_deductions)}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Effective rate: {(tax.effective_tax_rate * 100).toFixed(1)}%
        </p>
      </div>

      {/* Take-home */}
      <div className={`rounded-xl p-4 border ${highlight ? 'bg-gradient-to-br from-gold-deep/30 to-gold/10 border-gold/40' : 'bg-mint-deep/10 border-mint-deep/40'}`}>
        <p className="font-mono text-xs text-white/70 uppercase tracking-wider mb-1">Take-Home Annual</p>
        <p className={`text-3xl font-extrabold ${highlight ? 'text-gold' : 'text-white'}`}>{fmt(sym, tax.take_home_annual)}</p>
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
                       className="text-gold hover:text-gold-soft hover:underline transition-colors">
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
  const onPointerMove = useSpotlight()

  return (
    <div className="space-y-6">
      <RevealOnScroll>
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-gold">Results for</p>
          <h1 className="font-serif text-xl font-bold text-white">{results.job_role}</h1>
        </div>
      </RevealOnScroll>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevealOnScroll delay={0}>
          <CountryCard data={a} highlight={highlightIdx === 0} onPointerMove={onPointerMove} />
        </RevealOnScroll>
        <RevealOnScroll delay={130}>
          <CountryCard data={b} highlight={highlightIdx === 1} onPointerMove={onPointerMove} />
        </RevealOnScroll>
      </div>

      <RevealOnScroll delay={260}>
        <CurrencyConverter countries={results.countries} onWinnerChange={setHighlightIdx} />
      </RevealOnScroll>

      <p className="text-center text-xs text-slate-500">
        Estimates based on publicly available salary data and current tax policies. Individual circumstances may vary.
      </p>
    </div>
  )
}
