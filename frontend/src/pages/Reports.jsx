import { useState } from 'react'
import { api } from '../lib/api'
import DateFilter from '../components/DateFilter'

function ReportsPage() {
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' })
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

  return (
    <section className="page">
      <h2>P&amp;L Reports</h2>

      <DateFilter
        value={filters}
        onChange={setFilters}
        onApply={() => loadReport(filters)}
        onReset={() => {
          const next = { dateFrom: '', dateTo: '' }
          setFilters(next)
          loadReport(next)
        }}
      />

      <button type="button" onClick={() => loadReport(filters)}>
        Generate Report
      </button>

      {loading && <p>Loading report...</p>}
      {error && <p className="error">{error}</p>}

      {report && (
        <div className="cards">
          <article className="card">
            <p>Total Sales Revenue</p>
            <h3>{report.total_sales_revenue?.toFixed(2)}</h3>
          </article>
          <article className="card">
            <p>Total Purchase Cost</p>
            <h3>{report.total_purchase_cost?.toFixed(2)}</h3>
          </article>
          <article className="card">
            <p>Gross Profit</p>
            <h3>{report.gross_profit?.toFixed(2)}</h3>
          </article>
          <article className="card">
            <p>Total Expenses</p>
            <h3>{report.total_expenses?.toFixed(2)}</h3>
          </article>
          <article className="card">
            <p>Net Profit</p>
            <h3>{report.net_profit?.toFixed(2)}</h3>
          </article>
        </div>
      )}
    </section>
  )
}

export default ReportsPage
