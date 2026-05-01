import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import SKUSearch from '../components/SKUSearch'
import DateFilter from '../components/DateFilter'
import EntryTable from '../components/EntryTable'

const initialForm = {
  sku_id: '',
  qty: '',
  purchase_price: '',
  expected_sale_price: '',
  vendor: '',
  invoice_number: '',
  date: '',
}

function PurchasePage() {
  const [skus, setSkus] = useState([])
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' })

  async function loadSkus() {
    const data = await api.sku.list('')
    setSkus(data)
  }

  async function loadPurchases(activeFilters = filters) {
    try {
      const data = await api.purchase.list(activeFilters)
      setRows(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadSkus()
    loadPurchases()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.purchase.create({
        ...form,
        qty: Number(form.qty),
        purchase_price: Number(form.purchase_price),
        expected_sale_price: form.expected_sale_price ? Number(form.expected_sale_price) : null,
      })
      setForm(initialForm)
      await loadPurchases()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (id) => {
    try {
      await api.purchase.remove(id)
      await loadPurchases()
    } catch (err) {
      setError(err.message)
    }
  }

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'sku_id', title: 'SKU ID' },
    { key: 'qty', title: 'Qty' },
    { key: 'purchase_price', title: 'Purchase Price' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'invoice_number', title: 'Invoice #' },
    { key: 'date', title: 'Date', render: (row) => row.date?.slice(0, 10) || '-' },
  ]

  return (
    <section className="page">
      <h2>Purchases</h2>
      <form className="grid-form" onSubmit={submit}>
        <SKUSearch value={form.sku_id} onChange={(value) => setForm({ ...form, sku_id: value })} skus={skus} />
        <input type="number" min="1" placeholder="Qty" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} required />
        <input type="number" min="0" step="0.01" placeholder="Purchase Price" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} required />
        <input type="number" min="0" step="0.01" placeholder="Expected Sale Price (optional)" value={form.expected_sale_price} onChange={(e) => setForm({ ...form, expected_sale_price: e.target.value })} />
        <input placeholder="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        <input placeholder="Invoice Number" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <button type="submit">Add Purchase</button>
      </form>

      <DateFilter
        value={filters}
        onChange={setFilters}
        onApply={() => loadPurchases(filters)}
        onReset={() => {
          const next = { dateFrom: '', dateTo: '' }
          setFilters(next)
          loadPurchases(next)
        }}
      />

      {error && <p className="error">{error}</p>}
      <EntryTable columns={columns} rows={rows} onDelete={remove} deleteLabel="Soft Delete" />
    </section>
  )
}

export default PurchasePage
