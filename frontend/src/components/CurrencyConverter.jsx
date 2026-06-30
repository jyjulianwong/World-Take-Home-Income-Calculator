import { useState, useEffect } from 'react'

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

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
      <div>
        <h3 className="font-semibold text-white mb-0.5">Compare in a single currency</h3>
        <p className="text-xs text-slate-500">Rates from Open Exchange Rates, updated daily.</p>
      </div>

      {/* Currency picker */}
      <div className="flex flex-wrap items-center gap-2">
        {QUICK.map(c => (
          <button
            key={c}
            onClick={() => { setCustom(''); setTarget(c) }}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
              ${activeCurrency === c && !custom
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            {c}
          </button>
        ))}
        <input
          value={custom}
          onChange={e => setCustom(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          maxLength={3}
          placeholder="Other…"
          className="w-20 px-3 py-1 rounded-lg text-sm bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Converted take-home cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {countries.map((c, i) => {
          const converted = convert(c.tax.take_home_annual, c.currency)
          const convertedMonthly = converted != null ? Math.round(converted / 12) : null

          return (
            <div key={i} className="rounded-xl bg-slate-800 p-4 space-y-1">
              <p className="text-xs font-semibold text-slate-300">{c.name}</p>
              <p className="text-xs text-slate-500">
                {c.currency_symbol}{c.tax.take_home_annual.toLocaleString()} {c.currency} / yr
              </p>
              {fetching ? (
                <p className="text-xl font-bold text-slate-500 animate-pulse mt-1">Converting…</p>
              ) : converted != null ? (
                <>
                  <p className="text-2xl font-extrabold text-white">
                    {fmtCurrency(converted, activeCurrency)}
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
    </div>
  )
}
