import { useState, useEffect, useRef } from 'react'

const QUICK = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'HKD']

function fmtCurrency(amount, code) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${code} ${amount.toLocaleString()}`
  }
}

const BAR_SERIES = [
  { track: 'bg-white/5', fill: 'bg-gradient-to-r from-gold-deep to-gold', glow: '0 0 24px -4px rgba(231, 196, 126, 0.55)' },
  { track: 'bg-white/5', fill: 'bg-gradient-to-r from-mint-deep to-mint', glow: '0 0 24px -4px rgba(92, 225, 198, 0.55)' },
]

function ComparisonBars({ countries, converted, activeCurrency }) {
  const [grown, setGrown] = useState(false)
  const max = Math.max(...converted.filter(v => v != null), 1)

  useEffect(() => {
    setGrown(false)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)))
    return () => cancelAnimationFrame(id)
  }, [converted.join(',')])

  if (converted.every(v => v == null)) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 font-mono text-xs text-slate-400">
        {countries.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-gold' : 'bg-mint'}`} />
            {c.name}
          </span>
        ))}
      </div>

      {countries.map((c, i) => {
        const value = converted[i]
        const series = BAR_SERIES[i]
        const widthPct = value != null ? Math.max((value / max) * 100, 4) : 0

        return (
          <div key={i} className="flex items-center gap-3">
            <div className={`relative flex-1 h-3.5 rounded-full overflow-hidden ${series.track}`}>
              {value != null ? (
                <div
                  className={`bar-grow h-full rounded-full ${series.fill}`}
                  style={{
                    width: '100%',
                    transform: `scaleX(${grown ? widthPct / 100 : 0})`,
                    boxShadow: series.glow,
                  }}
                />
              ) : (
                <div className="absolute inset-0 rounded-full border border-dashed border-white/15" />
              )}
            </div>
            <span className="font-mono text-xs text-slate-300 w-24 text-right shrink-0">
              {value != null ? fmtCurrency(value, activeCurrency) : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function CurrencyConverter({ countries, onWinnerChange }) {
  const [target, setTarget]     = useState('USD')
  const [custom, setCustom]     = useState('')
  const [rates, setRates]       = useState(null)   // { [ISO]: rate } where 1 target = rate ISO
  const [fetching, setFetching] = useState(false)
  const [error, setError]       = useState(null)

  const activeCurrency = custom.trim().toUpperCase() || target

  useEffect(() => {
    if (activeCurrency.length !== 3) return
    let cancelled = false
    setFetching(true)
    setError(null)

    const base = import.meta.env.VITE_API_BASE_URL ?? ''
    fetch(`${base}/api/rates?from_currency=${activeCurrency}`)
      .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.detail ?? `"${activeCurrency}" is not a supported currency code`) })
        return r.json()
      })
      .then(json => {
        if (!cancelled) setRates(json.rates)
      })
      .catch(e => {
        if (!cancelled) { setError(e.message); setRates(null) }
      })
      .finally(() => { if (!cancelled) setFetching(false) })

    return () => { cancelled = true }
  }, [activeCurrency])

  // Notify parent of the winner whenever rates or currency selection changes
  useEffect(() => {
    if (!rates || !onWinnerChange) return
    const amounts = countries.map(c => {
      const rate = rates[c.currency]
      return rate != null ? c.tax.take_home_annual / rate : null
    })
    if (amounts[0] == null || amounts[1] == null) { onWinnerChange(null); return }
    onWinnerChange(amounts[0] >= amounts[1] ? 0 : 1)
  }, [rates]) // eslint-disable-line react-hooks/exhaustive-deps

  // Convert `amount` in `fromCurrency` into `activeCurrency`
  // rates map: 1 activeCurrency = rates[X] of X  →  amount X = amount / rates[X] activeCurrency
  function convert(amount, fromCurrency) {
    if (!rates) return null
    if (fromCurrency === activeCurrency) return amount
    const rate = rates[fromCurrency]
    return rate ? Math.round(amount / rate) : null
  }

  const converted = countries.map(c => convert(c.tax.take_home_annual, c.currency))

  return (
    <div className="glass rounded-3xl p-6 space-y-5">
      <div>
        <h3 className="font-serif font-semibold text-white mb-0.5">Compare in a single currency</h3>
        <p className="text-xs text-slate-500">Rates from Open Exchange Rates, updated daily.</p>
      </div>

      {/* Currency picker */}
      <div className="flex flex-wrap items-center gap-2">
        {QUICK.map(c => (
          <button
            key={c}
            onClick={() => { setCustom(''); setTarget(c) }}
            className={`px-3 py-1 rounded-full font-mono text-sm font-medium transition-colors
              ${activeCurrency === c && !custom
                ? 'bg-gradient-to-r from-gold-soft to-gold text-ink-950'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
          >
            {c}
          </button>
        ))}
        <input
          value={custom}
          onChange={e => setCustom(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          maxLength={3}
          placeholder="Other…"
          className="w-20 px-3 py-1 rounded-full font-mono text-sm bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-gold/40"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Converted take-home cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {countries.map((c, i) => {
          const value = converted[i]
          const convertedMonthly = value != null ? Math.round(value / 12) : null

          return (
            <div key={i} className="rounded-xl bg-white/5 p-4 space-y-1">
              <p className="text-xs font-semibold text-slate-300">{c.name}</p>
              <p className="font-mono text-xs text-slate-500">
                {c.currency_symbol}{c.tax.take_home_annual.toLocaleString()} {c.currency} / yr
              </p>
              {fetching ? (
                <div className="space-y-1.5 mt-1.5">
                  <div className="shimmer h-6 w-32 rounded" />
                  <div className="shimmer h-4 w-20 rounded" />
                </div>
              ) : value != null ? (
                <>
                  <p className="text-2xl font-extrabold text-white">
                    {fmtCurrency(value, activeCurrency)}
                    <span className="text-sm font-normal text-slate-400"> / yr</span>
                  </p>
                  <p className="text-sm text-slate-400">
                    {fmtCurrency(convertedMonthly, activeCurrency)} / mo
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 mt-1">
                  No rate available for {c.currency}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {!fetching && <ComparisonBars countries={countries} converted={converted} activeCurrency={activeCurrency} />}
    </div>
  )
}
