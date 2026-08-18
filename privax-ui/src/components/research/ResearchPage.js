import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { privaxApi } from '../misc/PrivaxApi'
import EpsilonSlider from '../reports/EpsilonSlider'
import './research.css'

const VACCINES = ['ALL', 'Pfizer', 'Moderna', 'AstraZeneca', 'Johnson & Johnson']
const SEVERITIES = ['ALL', 'MILD', 'MODERATE', 'SEVERE', 'FATAL']

function describeFilters(vaccineName, city, severity) {
  const parts = []
  if (vaccineName && vaccineName !== 'ALL') parts.push(vaccineName)
  if (city && city.trim()) parts.push(city.trim())
  if (severity && severity !== 'ALL') parts.push(severity)
  return parts.length ? parts.join(' · ') : 'All reports'
}

function ResearchPage() {
  const Auth = useAuth()
  const user = Auth.getUser()
  const isDoctor = user?.role === 'DOCTOR'

  const [budget, setBudget] = useState({ total: null, remaining: null })
  const [epsilon, setEpsilon] = useState(0.5)
  const [vaccineName, setVaccineName] = useState('ALL')
  const [city, setCity] = useState('')
  const [severity, setSeverity] = useState('ALL')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const loadBudget = () => {
    privaxApi.getResearchBudget()
      .then(res => setBudget({ total: res.data.budgetTotal, remaining: res.data.budgetRemaining }))
      .catch(err => console.error('Failed to load budget', err))
  }

  useEffect(loadBudget, [])

  const runQuery = async (e) => {
    e.preventDefault()
    setError('')
    const eps = parseFloat(epsilon)
    if (!eps || eps <= 0) {
      setError('Enter a positive epsilon.')
      return
    }
    setRunning(true)
    try {
      const res = await privaxApi.researchCount({ epsilon: eps, vaccineName, city, severity })
      const d = res.data
      setBudget({ total: d.budgetTotal, remaining: d.budgetRemaining })
      setHistory(h => [{
        id: Date.now(),
        filters: describeFilters(vaccineName, city, severity),
        epsilon: d.epsilonSpent,
        noisyCount: d.noisyCount,
        remaining: d.budgetRemaining,
      }, ...h])
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message
      if (status === 429) setError(msg || 'Privacy budget exhausted — no more queries can be answered this session.')
      else if (status === 400) setError(msg || 'Invalid epsilon for this query.')
      else if (status === 401) setError('Your session has expired. Please log in again.')
      else setError('Something went wrong running the query.')
    } finally {
      setRunning(false)
    }
  }

  const hasBudget = budget.total != null && budget.remaining != null
  const pct = hasBudget ? Math.max(0, Math.min(100, (budget.remaining / budget.total) * 100)) : 0
  const exhausted = hasBudget && budget.remaining <= 1e-9
  const low = hasBudget && !exhausted && budget.remaining < budget.total * 0.25

  // The research console is a clinician (DOCTOR) capability, granted only by admin approval.
  // A plain USER (including one whose request is still pending) never reaches it — the pending
  // banner explains the wait.
  if (!isDoctor) return <Navigate to="/" replace />

  return (
    <main className="research-page">
      <div className="research-header">
        <div className="research-header-left">
          <span className="research-eyebrow">Differential privacy · Researcher API</span>
          <h1 className="research-title">Research console</h1>
        </div>
        <p className="research-sub">
          Interactive, budgeted queries. Each query spends part of your privacy budget and returns a
          freshly-noised count. When the budget is gone, queries are refused — that ceiling is what
          bounds how much any one researcher can learn.
        </p>
      </div>

      {/* Budget meter */}
      <section className={`research-card research-budget ${exhausted ? 'is-exhausted' : low ? 'is-low' : ''}`}>
        <div className="research-budget-head">
          <div>
            <span className="research-card-eyebrow">Your privacy budget</span>
            <h2 className="research-budget-figure">
              {hasBudget ? budget.remaining.toFixed(2) : '—'}
              <span className="research-budget-total">
                {hasBudget ? ` / ${budget.total.toFixed(2)} ε` : ''}
              </span>
            </h2>
          </div>
          <span className="research-budget-user">{user?.name || user?.role || 'Researcher'}</span>
        </div>
        <div className="research-meter" aria-hidden="true">
          <div
            className="research-meter-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="research-budget-note">
          {exhausted
            ? 'Budget exhausted. Further queries are refused until the budget resets (server restart).'
            : `Every query debits its ε from this total (cumulative, per researcher). Spent so far: ${hasBudget ? (budget.total - budget.remaining).toFixed(2) : '—'} ε.`}
        </p>
      </section>

      {/* Query form */}
      <section className="research-card">
        <header className="research-card-head">
          <h2>Run a query</h2>
          <p>A differentially-private count of reports matching your filters.</p>
        </header>

        <form className="research-form" onSubmit={runQuery}>
          <EpsilonSlider
            value={Number(epsilon)}
            onChange={setEpsilon}
            min={0.1}
            max={1.0}
            step={0.1}
            label="Epsilon (this query)"
            hint="Higher ε = sharper answer · spends more budget · max 1.0"
            disabled={exhausted}
          />

          <div className="research-field-row">
            <div className="research-field">
              <label htmlFor="vaccine">Vaccine</label>
              <select id="vaccine" value={vaccineName} onChange={e => setVaccineName(e.target.value)} disabled={exhausted}>
                {VACCINES.map(v => <option key={v} value={v}>{v === 'ALL' ? 'All vaccines' : v}</option>)}
              </select>
            </div>
            <div className="research-field">
              <label htmlFor="severity">Severity</label>
              <select id="severity" value={severity} onChange={e => setSeverity(e.target.value)} disabled={exhausted}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All severities' : s}</option>)}
              </select>
            </div>
            <div className="research-field">
              <label htmlFor="city">City <span className="research-hint">optional</span></label>
              <input
                id="city"
                type="text"
                placeholder="e.g. Bucharest"
                value={city}
                onChange={e => setCity(e.target.value)}
                disabled={exhausted}
              />
            </div>
          </div>

          {error && <div className="research-error">{error}</div>}

          <button type="submit" className="research-btn" disabled={running || exhausted}>
            {exhausted ? 'Budget exhausted' : running ? 'Running…' : `Run query (spend ${Number(epsilon).toFixed(1)} ε)`}
          </button>
        </form>
      </section>

      {/* Query log */}
      <section className="research-card">
        <header className="research-card-head">
          <h2>Query log <span className="research-count-badge">{history.length}</span></h2>
          <p>Notice the count is noised <em>differently every time</em> — that's the interactive model. The budget is what keeps it safe.</p>
        </header>

        {history.length === 0 ? (
          <p className="research-empty">No queries yet. Run one above to see the noisy count and your budget draw down.</p>
        ) : (
          <ul className="research-log">
            {history.map(row => (
              <li key={row.id} className="research-log-row">
                <div className="research-log-main">
                  <span className="research-log-count">{Math.round(row.noisyCount).toLocaleString()}</span>
                  <span className="research-log-filters">{row.filters}</span>
                </div>
                <div className="research-log-meta">
                  <span className="research-log-eps">−{row.epsilon.toFixed(1)} ε</span>
                  <span className="research-log-sep">·</span>
                  <span className="research-log-rem">{row.remaining.toFixed(2)} ε left</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default ResearchPage
