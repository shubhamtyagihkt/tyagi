import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import DateFilter from '../components/DateFilter'
import EntryTable from '../components/EntryTable'
import { todayString } from '../lib/date'

function initialForm() {
  return {
    title: '',
    amount: '',
    notes: '',
    date: todayString(),
  }
}

function ExpensesPage() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ dateFrom: todayString(), dateTo: todayString() })

  async function loadExpenses(activeFilters = filters) {
    try {
      const data = await api.expense.list(activeFilters)
      setRows(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialExpenses() {
      try {
        const data = await api.expense.list({ dateFrom: todayString(), dateTo: todayString() })
        if (!ignore) {
          setRows(data)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message)
        }
      }
    }

    loadInitialExpenses()

    return () => {
      ignore = true
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.expense.create({
        ...form,
        amount: Number(form.amount),
      })
      setForm(initialForm())
      await loadExpenses()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (id) => {
    try {
      await api.expense.remove(id)
      await loadExpenses()
    } catch (err) {
      setError(err.message)
    }
  }

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'title', title: 'Title' },
    { key: 'amount', title: 'Amount' },
    { key: 'notes', title: 'Notes' },
    { key: 'date', title: 'Date', render: (row) => row.date?.slice(0, 10) || '-' },
  ]

  return (
    <section className="page">
      <h2>Expenses</h2>
      <form className="grid-form" onSubmit={submit}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input type="number" min="0" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <button type="submit">Add Expense</button>
      </form>

      <section className="recent-section">
        <h3>Recent Expenses</h3>
        <DateFilter
          value={filters}
          onChange={setFilters}
          onApply={() => loadExpenses(filters)}
          onReset={() => {
            const next = { dateFrom: todayString(), dateTo: todayString() }
            setFilters(next)
            loadExpenses(next)
          }}
        />
      </section>

      {error && <p className="error">{error}</p>}
      <EntryTable columns={columns} rows={rows} onDelete={remove} deleteLabel="Soft Delete" />
    </section>
  )
}

export default ExpensesPage
