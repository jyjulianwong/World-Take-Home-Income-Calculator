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
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 transition-colors"
      >
        {loading ? 'Comparing…' : 'Compare Take-Home Pay'}
      </button>
    </form>
  )
}
