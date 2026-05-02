import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import SKUSearch from '../components/SKUSearch'
import DateFilter from '../components/DateFilter'
import EntryTable from '../components/EntryTable'

const initialForm = {
  sku_id: '',
  qty: '',
  sale_price: '',
  customer: '',
  date: '',
}

function SalesPage() {
  const [skus, setSkus] = useState([])
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' })
  const skuById = useMemo(() => new Map(skus.map((sku) => [sku.id, sku])), [skus])
  const selectedSku = skuById.get(form.sku_id)

  async function loadSales(activeFilters = filters) {
    try {
      const data = await api.sale.list(activeFilters)
      setRows(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialData() {
      try {
        const [skuData, saleData] = await Promise.all([
          api.sku.list(''),
          api.sale.list({ dateFrom: '', dateTo: '' }),
        ])
        if (ignore) return
        setSkus(skuData)
        setRows(saleData)
      } catch (err) {
        if (!ignore) {
          setError(err.message)
        }
      }
    }

    loadInitialData()

    return () => {
      ignore = true
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.sale.create({
        ...form,
        qty: Number(form.qty),
        sale_price: Number(form.sale_price),
      })
      setForm(initialForm)
      await loadSales()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (id) => {
    try {
      await api.sale.remove(id)
      await loadSales()
    } catch (err) {
      setError(err.message)
    }
  }

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'sku_id', title: 'SKU ID' },
    { key: 'item_name', title: 'Item Name', render: (row) => skuById.get(row.sku_id)?.name || '-' },
    { key: 'qty', title: 'Qty' },
    { key: 'sale_price', title: 'Sale Price' },
    { key: 'customer', title: 'Customer' },
    { key: 'date', title: 'Date', render: (row) => row.date?.slice(0, 10) || '-' },
  ]

  return (
    <section className="page">
      <h2>Sales</h2>
      <form className="grid-form" onSubmit={submit}>
        <div className="field-stack">
          <SKUSearch value={form.sku_id} onChange={(value) => setForm({ ...form, sku_id: value })} skus={skus} />
          <span className="field-note">{selectedSku?.name || 'Item name'}</span>
        </div>
        <input type="number" min="1" placeholder="Qty" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} required />
        <input type="number" min="0" step="0.01" placeholder="Sale Price" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} required />
        <input placeholder="Customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <button type="submit">Add Sale</button>
      </form>

      <DateFilter
        value={filters}
        onChange={setFilters}
        onApply={() => loadSales(filters)}
        onReset={() => {
          const next = { dateFrom: '', dateTo: '' }
          setFilters(next)
          loadSales(next)
        }}
      />

      {error && <p className="error">{error}</p>}
      <EntryTable columns={columns} rows={rows} onDelete={remove} deleteLabel="Soft Delete" />
    </section>
  )
}

export default SalesPage
