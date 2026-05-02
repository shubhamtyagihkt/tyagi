import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function formatDate(date) {
  return date.toLocaleDateString('en-CA')
}

function salesTotal(rows) {
  return rows.reduce((sum, row) => sum + row.qty * row.sale_price, 0)
}

function Dashboard() {
  const [lowStockRows, setLowStockRows] = useState([])
  const [todaySales, setTodaySales] = useState(0)
  const [todayPurchases, setTodayPurchases] = useState(0)
  const [monthNetProfit, setMonthNetProfit] = useState(0)
  const [salesTrend, setSalesTrend] = useState({ daily: 0, weekly: 0, monthly: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    const now = new Date()
    const today = formatDate(now)
    const weekStartDate = new Date(now)
    const day = now.getDay()
    weekStartDate.setDate(now.getDate() + (day === 0 ? -6 : 1 - day))
    const weekStart = formatDate(weekStartDate)
    const monthStart = formatDate(new Date(now.getFullYear(), now.getMonth(), 1))

    async function load() {
      setError('')
      try {
        const [skus, dailySales, weeklySales, monthlySales, purchases, report] = await Promise.all([
          api.sku.list(''),
          api.sale.list({ dateFrom: today, dateTo: today }),
          api.sale.list({ dateFrom: weekStart, dateTo: today }),
          api.sale.list({ dateFrom: monthStart, dateTo: today }),
          api.purchase.list({ dateFrom: today, dateTo: today }),
          api.reports.summary({ dateFrom: monthStart, dateTo: today }),
        ])
        setLowStockRows(
          skus
            .filter((sku) => Number(sku.min_stock || 0) > 0 && sku.current_stock <= sku.min_stock)
            .sort((a, b) => a.current_stock - b.current_stock),
        )
        setTodaySales(salesTotal(dailySales))
        setTodayPurchases(purchases.reduce((sum, row) => sum + row.qty * row.purchase_price, 0))
        setMonthNetProfit(report.net_profit || 0)
        setSalesTrend({
          daily: salesTotal(dailySales),
          weekly: salesTotal(weeklySales),
          monthly: salesTotal(monthlySales),
        })
      } catch (err) {
        setError(err.message)
      }
    }

    load()
  }, [])

  return (
    <section className="page">
      <h2>Dashboard</h2>
      {error && <p className="error">{error}</p>}

      <div className="cards">
        <article className="card">
          <p>Today&apos;s Sales</p>
          <h3>{todaySales.toFixed(2)}</h3>
        </article>
        <article className="card">
          <p>Today&apos;s Purchases</p>
          <h3>{todayPurchases.toFixed(2)}</h3>
        </article>
        <article className="card">
          <p>Net Profit (MTD)</p>
          <h3>{monthNetProfit.toFixed(2)}</h3>
        </article>
      </div>

      <section className="dashboard-section">
        <h3>Sales Trend</h3>
        <div className="trend-grid">
          <article className="trend-card">
            <span>Daily</span>
            <strong>{salesTrend.daily.toFixed(2)}</strong>
          </article>
          <article className="trend-card">
            <span>Weekly</span>
            <strong>{salesTrend.weekly.toFixed(2)}</strong>
          </article>
          <article className="trend-card">
            <span>Monthly</span>
            <strong>{salesTrend.monthly.toFixed(2)}</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Low Stock Alerts</h3>
        {lowStockRows.length === 0 ? (
          <p className="empty">No low stock alerts.</p>
        ) : (
          <div className="alert-list">
            {lowStockRows.map((sku) => (
              <article className="stock-alert" key={sku.id}>
                <div>
                  <strong>{sku.name}</strong>
                  <span>{sku.id} · {sku.brand}</span>
                </div>
                <div className="stock-alert-counts">
                  <span>Stock: {sku.current_stock}</span>
                  <span>Min: {sku.min_stock}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default Dashboard
