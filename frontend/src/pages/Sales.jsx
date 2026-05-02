import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import SKUSearch from '../components/SKUSearch'
import DateFilter from '../components/DateFilter'
import EntryTable from '../components/EntryTable'

const initialEstimateLine = {
  sku_id: '',
  qty: '',
  sale_price: '',
}

const initialEstimate = {
  customer: '',
  date: '',
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function SalesPage() {
  const [skus, setSkus] = useState([])
  const [rows, setRows] = useState([])
  const [estimate, setEstimate] = useState(initialEstimate)
  const [estimateLine, setEstimateLine] = useState(initialEstimateLine)
  const [estimateLines, setEstimateLines] = useState([])
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' })
  const skuById = useMemo(() => new Map(skus.map((sku) => [sku.id, sku])), [skus])
  const selectedEstimateSku = skuById.get(estimateLine.sku_id)
  const estimateTotal = estimateLines.reduce(
    (total, line) => total + Number(line.qty) * Number(line.sale_price),
    0,
  )

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

  const addEstimateLine = (e) => {
    e.preventDefault()
    setError('')

    if (!selectedEstimateSku) {
      setError('Select a valid SKU for the estimate item.')
      return
    }

    const qty = Number(estimateLine.qty)
    const salePrice = Number(estimateLine.sale_price)
    if (!qty || qty <= 0 || !salePrice || salePrice <= 0) {
      setError('Estimate quantity and sale price must be greater than zero.')
      return
    }

    setEstimateLines([
      ...estimateLines,
      {
        line_id: crypto.randomUUID(),
        sku_id: estimateLine.sku_id,
        item_name: selectedEstimateSku.name,
        qty,
        sale_price: salePrice,
      },
    ])
    setEstimateLine(initialEstimateLine)
  }

  const removeEstimateLine = (lineId) => {
    setEstimateLines(estimateLines.filter((line) => line.line_id !== lineId))
  }

  const commitEstimate = async () => {
    setError('')

    if (!estimate.date) {
      setError('Select an estimate date before committing.')
      return
    }
    if (estimateLines.length === 0) {
      setError('Add at least one estimate item before committing.')
      return
    }

    try {
      for (const line of estimateLines) {
        await api.sale.create({
          sku_id: line.sku_id,
          qty: line.qty,
          sale_price: line.sale_price,
          customer: estimate.customer,
          date: estimate.date,
        })
      }
      setEstimate(initialEstimate)
      setEstimateLine(initialEstimateLine)
      setEstimateLines([])
      await loadSales()
    } catch (err) {
      setError(err.message)
    }
  }

  const printEstimate = () => {
    setError('')

    if (estimateLines.length === 0) {
      setError('Add at least one estimate item before printing.')
      return
    }

    const rowsHtml = estimateLines
      .map(
        (line, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(line.sku_id)}</td>
            <td>${escapeHtml(line.item_name)}</td>
            <td>${line.qty}</td>
            <td>${line.sale_price.toFixed(2)}</td>
            <td>${(line.qty * line.sale_price).toFixed(2)}</td>
          </tr>
        `,
      )
      .join('')

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      setError('Allow popups to print the estimate.')
      return
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Sales Estimate</title>
          <style>
            body { color: #111827; font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            .meta { margin-bottom: 20px; color: #374151; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            .total { margin-top: 16px; text-align: right; font-size: 18px; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Sales Estimate</h1>
          <div class="meta">
            <div>Customer: ${escapeHtml(estimate.customer || '-')}</div>
            <div>Date: ${escapeHtml(estimate.date || '-')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>S. No.</th>
                <th>SKU ID</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Sale Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="total">Total: ${estimateTotal.toFixed(2)}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
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
    { key: 'serial', title: 'S. No.', render: (row, index) => index + 1 },
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
      <section className="estimate-section flush">
        <h3>Estimate</h3>
        <div className="grid-form">
          <input
            placeholder="Customer"
            value={estimate.customer}
            onChange={(e) => setEstimate({ ...estimate, customer: e.target.value })}
          />
          <input
            type="date"
            value={estimate.date}
            onChange={(e) => setEstimate({ ...estimate, date: e.target.value })}
          />
        </div>

        <form className="grid-form" onSubmit={addEstimateLine}>
          <div className="field-stack">
            <SKUSearch
              value={estimateLine.sku_id}
              onChange={(value) => {
                const nextSku = skuById.get(value)
                setEstimateLine({
                  ...estimateLine,
                  sku_id: value,
                  sale_price: nextSku?.expected_sale_price || estimateLine.sale_price,
                })
              }}
              skus={skus}
            />
            <span className="field-note">{selectedEstimateSku?.name || 'Item name'}</span>
          </div>
          <input
            type="number"
            min="1"
            placeholder="Qty"
            value={estimateLine.qty}
            onChange={(e) => setEstimateLine({ ...estimateLine, qty: e.target.value })}
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Sale Price"
            value={estimateLine.sale_price}
            onChange={(e) => setEstimateLine({ ...estimateLine, sale_price: e.target.value })}
            required
          />
          <button type="submit">Add Item</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>S. No.</th>
                <th>SKU ID</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Sale Price</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {estimateLines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty">
                    No estimate items added.
                  </td>
                </tr>
              ) : (
                estimateLines.map((line, index) => (
                  <tr key={line.line_id}>
                    <td>{index + 1}</td>
                    <td>{line.sku_id}</td>
                    <td>{line.item_name}</td>
                    <td>{line.qty}</td>
                    <td>{line.sale_price.toFixed(2)}</td>
                    <td>{(line.qty * line.sale_price).toFixed(2)}</td>
                    <td>
                      <button type="button" className="danger" onClick={() => removeEstimateLine(line.line_id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="estimate-actions">
          <strong>Total: {estimateTotal.toFixed(2)}</strong>
          <button type="button" className="secondary" onClick={printEstimate}>
            Print Estimate
          </button>
          <button type="button" onClick={commitEstimate}>
            Commit Sales
          </button>
        </div>
      </section>

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
