import { useState } from 'react'
import InputForm from './components/InputForm'
import ProgressTracker from './components/ProgressTracker'
import StepOutput from './components/StepOutput'
import ResultsDisplay from './components/ResultsDisplay'

export default function App() {
  const [loading, setLoading]               = useState(false)
  const [progressSteps, setProgressSteps]   = useState([])
  const [intermediateData, setIntermediate] = useState({})
  const [submittedForm, setSubmittedForm]   = useState(null)
  const [results, setResults]               = useState(null)
  const [error, setError]                   = useState(null)

  async function handleSubmit(formData) {
    setLoading(true)
    setProgressSteps([])
    setIntermediate({})
    setSubmittedForm(formData)
    setResults(null)
    setError(null)

    try {
      const base = import.meta.env.VITE_API_BASE_URL ?? ''
      const response = await fetch(`${base}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))

          if (event.type === 'progress') {
            setProgressSteps(prev => [...prev, { step: event.step, status: event.status, message: event.message }])
            if (event.status === 'done' && event.data) {
              setIntermediate(prev => ({ ...prev, [event.step]: event.data }))
            }
          } else if (event.type === 'result') {
            setResults(event.data)
            setLoading(false)
          } else if (event.type === 'error') {
            setError(event.message)
            setLoading(false)
          }
        }
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            World Take-Home Income Comparison
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Enter your role and two countries to see real take-home pay side by side — after local taxes and mandatory contributions.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
          <InputForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {loading && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <p className="text-sm font-semibold text-slate-300 mb-4">Researching…</p>
            <ProgressTracker steps={progressSteps} />
          </div>
        )}

        {Object.keys(intermediateData).length > 0 && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {loading ? 'Research in progress' : 'Research data'}
            </p>
            <StepOutput submittedForm={submittedForm} intermediateData={intermediateData} />
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-950 border border-red-800 p-5 text-red-300 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && <ResultsDisplay results={results} />}
      </div>
    </div>
  )
}
