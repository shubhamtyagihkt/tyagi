import { useRef, useState } from 'react'
import { api } from '../lib/api'

function DatabaseSwitcher() {
  const inputRef = useRef(null)
  const [message, setMessage] = useState('')

  const selectDatabase = () => {
    inputRef.current?.click()
  }

  const uploadDatabase = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const confirmed = window.confirm(
      `You are about to switch the backend database to "${file.name}". This will change the data used by the whole app immediately. Continue only if you know this is the correct SQLite database.`,
    )
    if (!confirmed) return

    setMessage('Switching database...')
    try {
      await api.database.select(file)
      setMessage('Database switched. Refreshing app...')
      window.location.reload()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div className="database-switcher">
      <button type="button" className="secondary" onClick={selectDatabase}>
        Select DB
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".db,.sqlite,.sqlite3"
        onChange={uploadDatabase}
        hidden
      />
      {message && <span>{message}</span>}
    </div>
  )
}

export default DatabaseSwitcher
