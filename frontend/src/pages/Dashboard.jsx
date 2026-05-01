import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import EntryTable from '../components/EntryTable'

function Dashboard() {
  const [skuRows, setSkuRows] = useState([])
  const [todaySales, setTodaySales] = useState(0)
  const [todayPurchases, setTodayPurchases] = useState(0)
  const [monthNetProfit, setMonthNetProfit] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

    async function load() {
      setError('')
      try {
        const [skus, sales, purchases, report] = await Promise.all([
          api.sku.list(''),
          api.sale.list({ dateFrom: today, dateTo: today }),
          api.purchase.list({ dateFrom: today, dateTo: today }),
          api.reports.summary({ dateFrom: monthStart, dateTo: today }),
        ])
        setSkuRows(skus)
        setTodaySales(sales.reduce((sum, row) => sum + row.qty * row.sale_price, 0))
        setTodayPurchases(purchases.reduce((sum, row) => sum + row.qty * row.purchase_price, 0))
        setMonthNetProfit(report.net_profit || 0)
      } catch (err) {
        setError(err.message)
      }
    }

    load()
  }, [])

  const groupedRows = useMemo(() => {
    return [...skuRows].sort((a, b) =>
      `${a.category}-${a.subcategory}-${a.name}`.localeCompare(`${b.category}-${b.subcategory}-${b.name}`),
    )
  }, [skuRows])

  const columns = [
    { key: 'id', title: 'SKU ID' },
    { key: 'name', title: 'Name' },
    { key: 'category', title: 'Category' },
    { key: 'subcategory', title: 'Subcategory' },
    { key: 'brand', title: 'Brand' },
    { key: 'compatibility', title: 'Compatibility' },
    { key: 'current_stock', title: 'Current Stock' },
  ]

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

      <EntryTable columns={columns} rows={groupedRows} />
    </section>
  )
}

export default Dashboard
