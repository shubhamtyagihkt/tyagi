import { useMemo } from 'react'

function SKUSearch({ value, onChange, skus, placeholder = 'Search SKU...' }) {
  const options = useMemo(
    () =>
      skus.map((sku) => ({
        value: sku.id,
        label: `${sku.name} (${sku.id}) - ${sku.brand}`,
      })),
    [skus],
  )

  return (
    <div>
      <input
        list="sku-search-options"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id="sku-search-options">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
    </div>
  )
}

export default SKUSearch
