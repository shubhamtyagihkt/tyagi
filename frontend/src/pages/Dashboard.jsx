import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function formatDate(date) {
  return date.toLocaleDateString('en-CA')
}

function salesTotal(rows) {
  return rows.reduce((sum, row) => sum + row.qty * row.sale_price, 0)
}

function categorySales(rows, skuById) {
  const totals = new Map()

  rows.forEach((row) => {
    if (row.sale_type === 'service') {
      totals.set('Service', (totals.get('Service') || 0) + row.qty * row.sale_price)
      return
    }

    const sku = skuById.get(row.sku_id)
    const category = sku?.category || 'Uncategorized'
    totals.set(category, (totals.get(category) || 0) + row.qty * row.sale_price)
  })

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

function subcategorySales(rows, skuById) {
  const totals = new Map()

  rows.forEach((row) => {
    if (row.sale_type === 'service') {
      totals.set('Service', (totals.get('Service') || 0) + row.qty * row.sale_price)
      return
    }

    const sku = skuById.get(row.sku_id)
    const subcategory = sku?.subcategory || 'Uncategorized'
    totals.set(subcategory, (totals.get(subcategory) || 0) + row.qty * row.sale_price)
  })

  return [...totals.entries()]
    .map(([subcategory, total]) => ({ subcategory, total }))
    .sort((a, b) => b.total - a.total)
}

function productSales(rows, skuById) {
  const totals = new Map()

  rows.forEach((row) => {
    if (row.sale_type === 'service') {
      totals.set('Service', (totals.get('Service') || 0) + row.qty * row.sale_price)
      return
    }

    const sku = skuById.get(row.sku_id)
    const productName = sku?.name || 'Uncategorized'
    totals.set(productName, (totals.get(productName) || 0) + row.qty * row.sale_price)
  })

  return [...totals.entries()]
    .map(([product, total]) => ({ product, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)
}

function CategorySalesChart({ title, total, rows }) {
  const max = Math.max(...rows.map((row) => row.total), 0)

  return (
    <article className="chart-card">
      <div className="chart-card-header">
        <span>{title}</span>
        <strong>{total.toFixed(2)}</strong>
      </div>

      {rows.length === 0 ? (
        <p className="empty chart-empty">No sales in this period.</p>
      ) : (
        <div className="bar-chart">
          {rows.map((row) => (
            <div className="bar-row" key={row.category}>
              <div className="bar-label">
                <span>{row.category}</span>
                <strong>{row.total.toFixed(2)}</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(row.total / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function SubcategorySalesChart({ title, total, rows }) {
  const max = Math.max(...rows.map((row) => row.total), 0)

  return (
    <article className="chart-card">
      <div className="chart-card-header">
        <span>{title}</span>
        <strong>{total.toFixed(2)}</strong>
      </div>

      {rows.length === 0 ? (
        <p className="empty chart-empty">No sales in this period.</p>
      ) : (
        <div className="bar-chart">
          {rows.map((row) => (
            <div className="bar-row" key={row.subcategory}>
              <div className="bar-label">
                <span>{row.subcategory}</span>
                <strong>{row.total.toFixed(2)}</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(row.total / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function ProductSalesChart({ title, total, rows }) {
  const max = Math.max(...rows.map((row) => row.total), 0)

  return (
    <article className="chart-card">
      <div className="chart-card-header">
        <span>{title}</span>
        <strong>{total.toFixed(2)}</strong>
      </div>

      {rows.length === 0 ? (
        <p className="empty chart-empty">No sales in this period.</p>
      ) : (
        <div className="bar-chart">
          {rows.map((row) => (
            <div className="bar-row" key={row.product}>
              <div className="bar-label">
                <span title={row.product}>{row.product.length > 40 ? row.product.substring(0, 37) + '...' : row.product}</span>
                <strong>{row.total.toFixed(2)}</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(row.total / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function Dashboard() {
  const [lowStockRows, setLowStockRows] = useState([])
  const [todaySales, setTodaySales] = useState(0)
  const [todayPurchases, setTodayPurchases] = useState(0)
  const [monthNetProfit, setMonthNetProfit] = useState(0)
  const [salesTrend, setSalesTrend] = useState({
    daily: { total: 0, categories: [], subcategories: [], products: [] },
    weekly: { total: 0, categories: [], subcategories: [], products: [] },
    monthly: { total: 0, categories: [], subcategories: [], products: [] },
  })
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
        const skuById = new Map(skus.map((sku) => [sku.id, sku]))
        setSalesTrend({
          daily: {
            total: salesTotal(dailySales),
            categories: categorySales(dailySales, skuById),
            subcategories: subcategorySales(dailySales, skuById),
            products: productSales(dailySales, skuById),
          },
          weekly: {
            total: salesTotal(weeklySales),
            categories: categorySales(weeklySales, skuById),
            subcategories: subcategorySales(weeklySales, skuById),
            products: productSales(weeklySales, skuById),
          },
          monthly: {
            total: salesTotal(monthlySales),
            categories: categorySales(monthlySales, skuById),
            subcategories: subcategorySales(monthlySales, skuById),
            products: productSales(monthlySales, skuById),
          },
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
        <div className="section-heading">
          <h3>Sales Trend by Category</h3>
          <span>Day, week, and month performance grouped by item category.</span>
        </div>
        <div className="chart-grid">
          <CategorySalesChart
            title="Today"
            total={salesTrend.daily.total}
            rows={salesTrend.daily.categories}
          />
          <CategorySalesChart
            title="This Week"
            total={salesTrend.weekly.total}
            rows={salesTrend.weekly.categories}
          />
          <CategorySalesChart
            title="This Month"
            total={salesTrend.monthly.total}
            rows={salesTrend.monthly.categories}
          />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Sales Trend by Subcategory</h3>
          <span>Day, week, and month performance grouped by item subcategory.</span>
        </div>
        <div className="chart-grid">
          <SubcategorySalesChart
            title="Today"
            total={salesTrend.daily.total}
            rows={salesTrend.daily.subcategories}
          />
          <SubcategorySalesChart
            title="This Week"
            total={salesTrend.weekly.total}
            rows={salesTrend.weekly.subcategories}
          />
          <SubcategorySalesChart
            title="This Month"
            total={salesTrend.monthly.total}
            rows={salesTrend.monthly.subcategories}
          />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Top 20 Products by Sales</h3>
          <span>Day, week, and month performance grouped by individual product.</span>
        </div>
        <div className="chart-grid">
          <ProductSalesChart
            title="Today"
            total={salesTrend.daily.total}
            rows={salesTrend.daily.products}
          />
          <ProductSalesChart
            title="This Week"
            total={salesTrend.weekly.total}
            rows={salesTrend.weekly.products}
          />
          <ProductSalesChart
            title="This Month"
            total={salesTrend.monthly.total}
            rows={salesTrend.monthly.products}
          />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Low Stock Alerts</h3>
          <span>Items at or below their minimum stock threshold.</span>
        </div>
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
