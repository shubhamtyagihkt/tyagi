import { useId, useMemo } from 'react'

function normalizeOption(option) {
  if (typeof option === 'string') {
    return { value: option, label: option }
  }

  return option
}

function CreatableSearchSelect({
  value,
  onChange,
  options,
  placeholder,
  required = false,
}) {
  const id = useId()
  const normalizedOptions = useMemo(
    () => options.map(normalizeOption).filter((option) => option.value),
    [options],
  )

  const exactMatch = normalizedOptions.some(
    (option) => option.value.toLowerCase() === value.trim().toLowerCase(),
  )
  const showCreateHint = value.trim() && !exactMatch

  return (
    <div className="search-select">
      <input
        list={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
      <datalist id={id}>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
      {showCreateHint && <span className="create-hint">Create "{value.trim()}"</span>}
    </div>
  )
}

export default CreatableSearchSelect
