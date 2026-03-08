import { useState } from 'react'
import './App.css'
import FallingStars from './Components/FallingStars'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://url-shortener-backend-9yki.onrender.com'

function App() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])
  const [copiedHistoryId, setCopiedHistoryId] = useState(null)

  async function handleShorten() {
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setResult(null)
    setCopied(false)

    try {
      const res = await fetch(`${API_BASE}/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.')
        return
      }

      const entry = {
        id: Date.now(),
        shortUrl: data.data.shortUrl,
        shortCode: data.data.shortCode,
        originalUrl: data.data.originalUrl,
        createdAt: new Date().toLocaleString(),
      }

      setResult(entry)
      setHistory(prev => [entry, ...prev])
      setUrl('')
    } catch {
      setError('Unable to connect to the server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleShorten()
  }

  async function copyToClipboard(text, historyId = null) {
    try {
      await navigator.clipboard.writeText(text)
      if (historyId !== null) {
        setCopiedHistoryId(historyId)
        setTimeout(() => setCopiedHistoryId(null), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      if (historyId !== null) {
        setCopiedHistoryId(historyId)
        setTimeout(() => setCopiedHistoryId(null), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  return (
    <>
      <FallingStars />

      <div className="app-wrapper">
        <header className="app-header">
          <h1 className="app-header-title">
            <span className="title-dark">Shorten URLs.</span>
            <br />
            <span className="title-gradient">Simply.</span>
          </h1>
          <p className="app-header-subtitle">
            Transform long links into clean, shareable URLs
          </p>
        </header>

        <div className="glass-card">
          <div className="url-input-section">
            <div className="input-row">
              <div className="input-wrapper">
                <input
                  className="url-input"
                  type="url"
                  placeholder="Paste your long URL here..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  id="url-input"
                />
                {url && (
                  <button
                    className="input-clear-btn"
                    onClick={() => setUrl('')}
                    aria-label="Clear input"
                  >
                    &times;
                  </button>
                )}
              </div>
              <button
                className="shorten-btn"
                onClick={handleShorten}
                disabled={loading || !url.trim()}
                id="shorten-btn"
              >
                {loading ? 'Shortening...' : 'Shorten'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loading-ring" />
              <span className="loading-text">Generating your short link...</span>
            </div>
          )}

          {error && (
            <div className="error-alert" id="error-alert">
              <div className="error-alert-header">
                <span className="error-alert-icon">&#9888;</span>
                <span className="error-alert-title">Oops!</span>
              </div>
              <p className="error-alert-message">{error}</p>
            </div>
          )}

          {result && !loading && (
            <div className="result-card" id="result-card">
              <div className="result-card-header">
                <div className="result-check-icon">&#10003;</div>
                <span className="result-card-title">Your short link is ready!</span>
              </div>

              <div className="short-url-row">
                <span className="short-url-text">{result.shortUrl}</span>
                <button
                  className={`copy-btn${copied ? ' copied' : ''}`}
                  onClick={() => copyToClipboard(result.shortUrl)}
                  id="copy-btn"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="result-meta">
                <div className="result-meta-item">
                  <span className="result-meta-label">Original</span>
                  <span className="result-meta-value">{result.originalUrl}</span>
                </div>
                <div className="result-meta-item">
                  <span className="result-meta-label">Created</span>
                  <span className="result-meta-value">{result.createdAt}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {history.length > 1 && (
          <div className="history-section">
            <div className="history-header">
              <span className="history-title">Recent Links</span>
              <span className="history-count">{history.length} links</span>
            </div>
            <div className="history-list">
              {history.slice(1).map(item => (
                <div
                  className="history-item"
                  key={item.id}
                  onClick={() => {
                    setResult(item)
                    setCopied(false)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  <div className="history-item-link">
                    <div className="history-item-short">{item.shortCode}</div>
                    <div className="history-item-original">{item.originalUrl}</div>
                  </div>
                  <button
                    className={`history-item-copy${copiedHistoryId === item.id ? ' copied' : ''}`}
                    onClick={e => {
                      e.stopPropagation()
                      copyToClipboard(item.shortUrl, item.id)
                    }}
                  >
                    {copiedHistoryId === item.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App
