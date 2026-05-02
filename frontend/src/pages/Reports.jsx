import { useState } from 'react'
import { api } from '../lib/api'
import DateFilter from '../components/DateFilter'
import { todayString } from '../lib/date'

function formatDate(date) {
  return date.toLocaleDateString('en-CA')
}

function getPresetRange(preset) {
  const now = new Date()
  const today = formatDate(now)

  if (preset === 'today') {
    return { dateFrom: today, dateTo: today }
  }

  if (preset === 'week') {
    const start = new Date(now)
    const day = now.getDay()
    start.setDate(now.getDate() + (day === 0 ? -6 : 1 - day))
    return { dateFrom: formatDate(start), dateTo: today }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { dateFrom: formatDate(start), dateTo: today }
}

function ReportsPage() {
  const [filters, setFilters] = useState({ dateFrom: todayString(), dateTo: todayString() })
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadReport = async (activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.reports.summary(activeFilters)
      setReport(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (preset) => {
    const next = getPresetRange(preset)
    setFilters(next)
    loadReport(next)
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <h2>P&amp;L Reports</h2>
          <p>Review sales, purchase cost, expenses, and net profit by period.</p>
        </div>
        <button type="button" onClick={() => loadReport(filters)}>
          Generate Report
        </button>
      </div>

      <section className="report-panel">
        <div className="report-panel-block">
          <span className="panel-label">Quick range</span>
          <div className="quick-filters">
            <button type="button" className="secondary" onClick={() => applyPreset('today')}>
              Today
            </button>
            <button type="button" className="secondary" onClick={() => applyPreset('week')}>
              This Week
            </button>
            <button type="button" className="secondary" onClick={() => applyPreset('month')}>
              This Month
            </button>
          </div>
        </div>

        <div className="report-panel-block custom-range">
          <span className="panel-label">Custom range</span>
          <DateFilter
            value={filters}
            onChange={setFilters}
            onApply={() => loadReport(filters)}
            onReset={() => {
              const next = { dateFrom: todayString(), dateTo: todayString() }
              setFilters(next)
              loadReport(next)
            }}
          />
        </div>
      </section>

      {loading && <p>Loading report...</p>}
      {error && <p className="error">{error}</p>}

      {report && (
        <div className="report-grid">
          <article className="metric-card">
            <p>Total Sales Revenue</p>
            <h3>{report.total_sales_revenue?.toFixed(2)}</h3>
          </article>
          <article className="metric-card">
            <p>Total Purchase Cost</p>
            <h3>{report.total_purchase_cost?.toFixed(2)}</h3>
          </article>
          <article className="metric-card">
            <p>Gross Profit</p>
            <h3>{report.gross_profit?.toFixed(2)}</h3>
          </article>
          <article className="metric-card">
            <p>Total Expenses</p>
            <h3>{report.total_expenses?.toFixed(2)}</h3>
          </article>
          <article className="metric-card emphasis">
            <p>Net Profit</p>
            <h3>{report.net_profit?.toFixed(2)}</h3>
          </article>
        </div>
      )}
    </section>
  )
}

export default ReportsPage
