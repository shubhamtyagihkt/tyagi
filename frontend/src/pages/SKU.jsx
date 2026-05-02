import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import EntryTable from '../components/EntryTable'
import CreatableSearchSelect from '../components/CreatableSearchSelect'

const fixedUnits = ['piece', 'kg', 'litre', 'metre', 'inch', 'cm', 'millilitre']

const initialForm = {
  name: '',
  category: '',
  subcategory: '',
  brand: '',
  compatibility: '',
  unit: '',
  expected_sale_price: '',
  min_stock: '',
}

function SKUPage() {
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState(null)
  const [rows, setRows] = useState([])
  const [skuOptions, setSkuOptions] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  function uniqueValues(field, fallback = []) {
    const seen = new Set()

    return [...fallback, ...skuOptions.map((sku) => sku[field])]
      .map((value) => String(value || '').trim())
      .filter((value) => {
        const key = value.toLowerCase()
        if (!value || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => a.localeCompare(b))
  }

  async function loadSkuOptions() {
    const data = await api.sku.list()
    setSkuOptions(data)
    return data
  }

  async function loadData(query = '') {
    setLoading(true)
    setError('')
    try {
      const data = await api.sku.list(query)
      setRows(data)
      if (!query) {
        setSkuOptions(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialData() {
      try {
        const data = await api.sku.list()
        if (ignore) return
        setRows(data)
        setSkuOptions(data)
      } catch (err) {
        if (!ignore) {
          setError(err.message)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
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
      await api.sku.create({
        ...form,
        expected_sale_price: Number(form.expected_sale_price || 0),
        min_stock: Number(form.min_stock || 0),
      })
      setForm(initialForm)
      await loadSkuOptions()
      await loadData(search)
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (row) => {
    setEditingId(row.id)
    setEditForm({
      name: row.name || '',
      category: row.category || '',
      subcategory: row.subcategory || '',
      brand: row.brand || '',
      compatibility: row.compatibility || '',
      unit: row.unit || '',
      expected_sale_price: String(row.expected_sale_price ?? ''),
      min_stock: String(row.min_stock ?? ''),
    })
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditForm(null)
  }

  const updateEditField = (field, value) => {
    setEditForm({ ...editForm, [field]: value })
  }

  const renderEditableCell = (row, field, inputProps = {}) => {
    if (editingId !== row.id) {
      return row[field]
    }

    return (
      <input
        className="table-input"
        value={editForm[field]}
        onChange={(e) => updateEditField(field, e.target.value)}
        {...inputProps}
      />
    )
  }

  const saveEdit = async (row) => {
    setError('')
    try {
      await api.sku.update(row.id, {
        ...editForm,
        expected_sale_price: Number(editForm.expected_sale_price || 0),
        min_stock: Number(editForm.min_stock || 0),
      })
      cancelEdit()
      await loadSkuOptions()
      await loadData(search)
    } catch (err) {
      setError(err.message)
    }
  }

  const columns = [
    { key: 'id', title: 'SKU ID' },
    { key: 'name', title: 'Name', render: (row) => renderEditableCell(row, 'name') },
    { key: 'category', title: 'Category', render: (row) => renderEditableCell(row, 'category') },
    { key: 'subcategory', title: 'Subcategory', render: (row) => renderEditableCell(row, 'subcategory') },
    { key: 'brand', title: 'Brand', render: (row) => renderEditableCell(row, 'brand') },
    { key: 'unit', title: 'Unit' },
    {
      key: 'expected_sale_price',
      title: 'Expected Sale Price',
      render: (row) =>
        renderEditableCell(row, 'expected_sale_price', {
          type: 'number',
          min: '0',
          step: '0.01',
        }),
    },
    {
      key: 'min_stock',
      title: 'Min Stock',
      render: (row) =>
        renderEditableCell(row, 'min_stock', {
          type: 'number',
          min: '0',
          step: '1',
        }),
    },
    { key: 'current_stock', title: 'Current Stock' },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) =>
        editingId === row.id ? (
          <div className="row-actions">
            <button type="button" onClick={() => saveEdit(row)}>
              Save
            </button>
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="secondary" onClick={() => startEdit(row)}>
            Edit
          </button>
        ),
    },
  ]

  return (
    <section className="page">
      <h2>SKU Master List</h2>

      <form className="grid-form" onSubmit={submit}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <CreatableSearchSelect
          placeholder="Category"
          value={form.category}
          onChange={(category) => setForm({ ...form, category })}
          options={uniqueValues('category')}
          required
        />
        <CreatableSearchSelect
          placeholder="Subcategory"
          value={form.subcategory}
          onChange={(subcategory) => setForm({ ...form, subcategory })}
          options={uniqueValues('subcategory')}
          required
        />
        <CreatableSearchSelect
          placeholder="Brand"
          value={form.brand}
          onChange={(brand) => setForm({ ...form, brand })}
          options={uniqueValues('brand')}
          required
        />
        <input placeholder="Compatibility" value={form.compatibility} onChange={(e) => setForm({ ...form, compatibility: e.target.value })} />
        <CreatableSearchSelect
          placeholder="Unit"
          value={form.unit}
          onChange={(unit) => setForm({ ...form, unit })}
          options={uniqueValues('unit', fixedUnits)}
          required
        />
        <input
          placeholder="Expected Sale Price"
          type="number"
          min="0"
          step="0.01"
          value={form.expected_sale_price}
          onChange={(e) => setForm({ ...form, expected_sale_price: e.target.value })}
        />
        <input
          placeholder="Min Stock"
          type="number"
          min="0"
          step="1"
          value={form.min_stock}
          onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
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
