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
  const [categoryFilter, setCategoryFilter] = useState('')
  const [subcategoryFilter, setSubcategoryFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
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

  async function loadData(query = '', category = '', subcategory = '', brand = '', isInitialLoad = false) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (category) params.append('category', category)
      if (subcategory) params.append('subcategory', subcategory)
      if (brand) params.append('brand', brand)

      // For initial load, show top 20 recent SKUs
      if (isInitialLoad) {
        params.append('sort', 'recent')
        params.append('limit', '20')
      }

      const queryString = params.toString()
      const url = queryString ? `/api/sku?${queryString}` : '/api/sku'

      const data = await api.sku.list(url)
      setRows(data)
      if (!query && !category && !subcategory && !brand) {
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
        await loadData('', '', '', '', true)
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
      await loadData(search, categoryFilter, subcategoryFilter, brandFilter)
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
      await loadData(search, categoryFilter, subcategoryFilter, brandFilter)
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

      {/* Enhanced Search and Filter Section */}
      <div className="search-section">
        <h3>Advanced Search & Filters</h3>

        <div className="search-filters">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="🔍 Search SKUs by name, ID, category, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="large-search-input"
              onKeyPress={(e) => e.key === 'Enter' && loadData(search, categoryFilter, subcategoryFilter, brandFilter)}
            />
            <button
              type="button"
              className="search-button"
              onClick={() => loadData(search, categoryFilter, subcategoryFilter, brandFilter)}
            >
              Search
            </button>
            <button
              type="button"
              className="clear-button"
              onClick={() => {
                setSearch('')
                setCategoryFilter('')
                setSubcategoryFilter('')
                setBrandFilter('')
                loadData('', '', '', '', true)
              }}
            >
              Clear All
            </button>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {uniqueValues('category').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Subcategory:</label>
              <select
                value={subcategoryFilter}
                onChange={(e) => setSubcategoryFilter(e.target.value)}
              >
                <option value="">All Subcategories</option>
                {uniqueValues('subcategory').map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Brand:</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                <option value="">All Brands</option>
                {uniqueValues('brand').map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button
              type="button"
              className="filter-button"
              onClick={() => loadData(search, categoryFilter, subcategoryFilter, brandFilter)}
            >
              Apply Filters
            </button>
            <button
              type="button"
              className="reset-button"
              onClick={() => loadData('', '', '', '', true)}
            >
              Show Recent (Top 20)
            </button>
          </div>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <EntryTable columns={columns} rows={rows} />
    </section>
  )
}

export default SKUPage
