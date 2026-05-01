function DateFilter({ value, onChange, onApply, onReset }) {
  return (
    <div className="date-filter">
      <label>
        From
        <input
          type="date"
          value={value.dateFrom}
          onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
        />
      </label>
      <label>
        To
        <input
          type="date"
          value={value.dateTo}
          onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
        />
      </label>
      <button type="button" onClick={onApply}>
        Apply
      </button>
      <button type="button" className="secondary" onClick={onReset}>
        Reset
      </button>
    </div>
  )
}

export default DateFilter
