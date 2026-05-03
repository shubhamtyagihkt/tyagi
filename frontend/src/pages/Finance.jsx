import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { todayString } from '../lib/date'

function initialForm() {
  return {
    title: 'Investment',
    amount: '',
    notes: '',
    date: todayString(),
  }
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

function InputOutputDisplay({ input, output }) {
  const net = input - output
  const netColor = net < 0 ? '#d32f2f' : '#1976d2' // red if negative, blue if positive
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
      <div style={{ fontSize: '0.9em', color: '#666' }}>
        Input: <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>₹{formatMoney(input)}</span>
      </div>
      <div style={{ fontSize: '0.9em', color: '#666' }}>
        Output: <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>₹{formatMoney(output)}</span>
      </div>
      <div style={{ fontSize: '0.9em', color: '#666', borderTop: '1px solid #e0e0e0', paddingTop: '4px', marginTop: '2px' }}>
        Net: <span style={{ color: netColor, fontWeight: 'bold' }}>₹{formatMoney(net)}</span>
      </div>
    </div>
  )
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
      setForm(initialForm())
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
              <p>Today</p>
              <h3><InputOutputDisplay input={summary.today.input} output={summary.today.output} /></h3>
            </article>
            <article className="card">
              <p>This Week</p>
              <h3><InputOutputDisplay input={summary.week.input} output={summary.week.output} /></h3>
            </article>
            <article className="card">
              <p>This Month</p>
              <h3><InputOutputDisplay input={summary.month.input} output={summary.month.output} /></h3>
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
