import { useState, useEffect } from 'react'
import './App.css'

// Types for API responses
interface JobResponse {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'error'
}

interface JobStatus {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  result?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export default function App() {
  const [input, setInput] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)

  // Submit job
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) {
      setError('Please enter some text')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/jobs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input }),
      })

      if (!response.ok) {
        throw new Error(`Failed to submit job: ${response.statusText}`)
      }

      const data: JobResponse = await response.json()
      setJobId(data.jobId)
      setStatus({
        id: data.jobId,
        status: 'queued',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      setPolling(true)
      setInput('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Poll job status
  useEffect(() => {
    if (!polling || !jobId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch job status')
        }

        const data: JobStatus = await response.json()
        setStatus(data)

        // Stop polling if job is completed or errored
        if (data.status === 'completed' || data.status === 'error') {
          setPolling(false)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [polling, jobId])

  const handleNewJob = () => {
    setJobId(null)
    setStatus(null)
    setError(null)
    setPolling(false)
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Text Processing Queue</h1>
        <p>Submit text to be processed by our queue system</p>
      </header>

      <main className="main-content">
        {!jobId ? (
          // Initial form
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="text-input">Enter text to process:</label>
              <textarea
                id="text-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your text here..."
                rows={5}
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        ) : (
          // Status display
          <div className="status-display">
            <div className="job-info">
              <p>
                <strong>Job ID:</strong> <code>{jobId}</code>
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`status-badge status-${status?.status}`}>
                  {status?.status || 'unknown'}
                </span>
              </p>

              {status?.status === 'processing' && (
                <div className="loading-spinner">Processing...</div>
              )}
            </div>

            {status?.status === 'completed' && status.result && (
              <div className="results-box">
                <h3>Result</h3>
                <div className="result-content">{status.result}</div>
              </div>
            )}

            {status?.status === 'error' && (
              <div className="error-box">
                <h3>Error</h3>
                <div className="error-content">
                  {status.error_message || 'An error occurred during processing'}
                </div>
              </div>
            )}

            {status && (
              <div className="timestamps">
                <small>Created: {new Date(status.created_at).toLocaleString()}</small>
                <small>Updated: {new Date(status.updated_at).toLocaleString()}</small>
              </div>
            )}

            {(status?.status === 'completed' || status?.status === 'error') && (
              <button onClick={handleNewJob} className="new-job-btn">
                Process Another
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>&copy; 2024 Text Processing Queue Demo. Built with Supabase & Vercel.</p>
      </footer>
    </div>
  )
}
