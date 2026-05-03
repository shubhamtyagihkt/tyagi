import { useRef, useState } from 'react'
import { api } from '../lib/api'

function DatabaseSwitcher() {
  const inputRef = useRef(null)
  const [message, setMessage] = useState('')
  const [dbPath, setDbPath] = useState('')

  const selectDatabase = () => {
    inputRef.current?.focus()
  }

  const switchDatabase = async () => {
    if (!dbPath.trim()) {
      setMessage('Please enter a database path')
      return
    }

    const confirmed = window.confirm(
      `You are about to switch the backend database to "${dbPath}". This will change the data used by the whole app immediately. Continue only if you know this is the correct SQLite database path.`,
    )
    if (!confirmed) return

    setMessage('Switching database...')
    try {
      await api.database.select(dbPath.trim())
      setMessage('Database switched. Refreshing app...')
      window.location.reload()
    } catch (err) {
      setMessage(err.message)
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      switchDatabase()
    }
  }

  return (
    <div className="database-switcher">
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter database path (e.g., mydata.db)"
        value={dbPath}
        onChange={(e) => setDbPath(e.target.value)}
        onKeyPress={handleKeyPress}
        style={{ marginRight: '8px', padding: '4px' }}
      />
      <button type="button" className="secondary" onClick={switchDatabase}>
        Switch DB
      </button>
      {message && <span>{message}</span>}
    </div>
  )
}

export default DatabaseSwitcher
