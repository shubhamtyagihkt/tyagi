import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import EntryTable from '../components/EntryTable'

const initialForm = {
  name: '',
  category: '',
  subcategory: '',
  brand: '',
  compatibility: '',
  unit: '',
  expected_sale_price: '',
}

function SKUPage() {
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(initialForm)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadData(query = '') {
    setLoading(true)
    setError('')
    try {
      const data = await api.sku.list(query)
      setRows(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.sku.create({
        ...form,
        expected_sale_price: Number(form.expected_sale_price || 0),
      })
      setForm(initialForm)
      await loadData(search)
    } catch (err) {
      setError(err.message)
    }
  }

  const columns = [
    { key: 'id', title: 'SKU ID' },
    { key: 'name', title: 'Name' },
    { key: 'category', title: 'Category' },
    { key: 'subcategory', title: 'Subcategory' },
    { key: 'brand', title: 'Brand' },
    { key: 'unit', title: 'Unit' },
    { key: 'expected_sale_price', title: 'Expected Sale Price' },
    { key: 'current_stock', title: 'Current Stock' },
  ]

  return (
    <section className="page">
      <h2>SKU Master List</h2>

      <form className="grid-form" onSubmit={submit}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <input placeholder="Subcategory" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} required />
        <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
        <input placeholder="Compatibility" value={form.compatibility} onChange={(e) => setForm({ ...form, compatibility: e.target.value })} />
        <input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
        <input
          placeholder="Expected Sale Price"
          type="number"
          min="0"
          step="0.01"
          value={form.expected_sale_price}
          onChange={(e) => setForm({ ...form, expected_sale_price: e.target.value })}
        />
        <button type="submit">Add SKU</button>
      </form>

      <div className="toolbar">
        <input
          placeholder="Search by name/id/category/brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" onClick={() => loadData(search)}>
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <EntryTable columns={columns} rows={rows} />
    </section>
  )
}

export default SKUPage
