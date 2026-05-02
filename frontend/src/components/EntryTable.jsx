function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function EntryTable({ columns, rows, onDelete, deleteLabel = 'Delete' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.title}</th>
            ))}
            {onDelete && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onDelete ? 1 : 0)} className="empty">
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={`${row.id}-${column.key}`}>
                    {column.render ? column.render(row, index) : formatValue(row[column.key])}
                  </td>
                ))}
                {onDelete && (
                  <td>
                    <button type="button" className="danger" onClick={() => onDelete(row.id)}>
                      {deleteLabel}
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default EntryTable
