import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const initialForm = {
  title: 'Investment',
  amount: '',
  notes: '',
  date: new Date().toLocaleDateString('en-CA'),
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

function FinancePage() {
  const [summary, setSummary] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadFinance() {
    setLoading(true)
    setError('')
    try {
      const data = await api.finance.summary()
      setSummary(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialFinance() {
      setLoading(true)
      setError('')
      try {
        const data = await api.finance.summary()
        if (!ignore) {
          setSummary(data)
        }
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

    loadInitialFinance()

    return () => {
      ignore = true
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.finance.addInvestment({
        ...form,
        amount: Number(form.amount),
      })
      setForm(initialForm)
      await loadFinance()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page">
      <h2>Finance</h2>

      {loading && <p>Loading finance...</p>}
      {error && <p className="error">{error}</p>}

      {summary && (
        <>
          <div className="cards">
            <article className="card">
              <p>Total Money Available</p>
              <h3>{formatMoney(summary.total_money_available)}</h3>
            </article>
            <article className="card">
              <p>Today Input / Output</p>
              <h3>{formatMoney(summary.today.input)} / {formatMoney(summary.today.output)}</h3>
            </article>
            <article className="card">
              <p>This Week Input / Output</p>
              <h3>{formatMoney(summary.week.input)} / {formatMoney(summary.week.output)}</h3>
            </article>
            <article className="card">
              <p>This Month Input / Output</p>
              <h3>{formatMoney(summary.month.input)} / {formatMoney(summary.month.output)}</h3>
            </article>
          </div>

          <section className="finance-section">
            <h3>Add Money</h3>
            <form className="grid-form" onSubmit={submit}>
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
              <input
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
              <button type="submit">Add Investment</button>
            </form>
          </section>

          <section className="finance-section">
            <h3>Recent Transactions</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>S. No.</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recent_transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    summary.recent_transactions.map((transaction, index) => (
                      <tr key={`${transaction.type}-${transaction.id}-${transaction.date}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{transaction.date}</td>
                        <td>
                          <span className={`money-pill ${transaction.type}`}>
                            {transaction.type === 'input' ? 'Input' : 'Output'}
                          </span>
                        </td>
                        <td>{transaction.title}</td>
                        <td>{formatMoney(transaction.amount)}</td>
                        <td>{transaction.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  )
}

export default FinancePage
