export default function InputForm({ onSubmit, loading }) {
  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSubmit({
      job_role: fd.get('job_role'),
      country1: fd.get('country1'),
      country2: fd.get('country2'),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Job Role
        </label>
        <input
          name="job_role"
          required
          disabled={loading}
          placeholder="e.g. Senior Software Engineer at Google (Tech)"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-gold/40 disabled:opacity-50"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Country / Region 1
          </label>
          <input
            name="country1"
            required
            disabled={loading}
            placeholder="e.g. United States"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-gold/40 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Country / Region 2
          </label>
          <input
            name="country2"
            required
            disabled={loading}
            placeholder="e.g. United Kingdom"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-gold/40 disabled:opacity-50"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-gold-soft via-gold to-gold-deep text-ink-950 font-semibold py-3 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
      >
        {loading ? 'Comparing…' : 'Compare Take-Home Pay'}
      </button>
    </form>
  )
}
