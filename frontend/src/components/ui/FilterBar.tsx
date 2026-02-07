interface FilterField {
  key: string
  label: string
  type: 'text' | 'select'
  options?: { value: string; label: string }[]
}

interface FilterBarProps {
  fields: FilterField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onClear: () => void
}

export default function FilterBar({ fields, values, onChange, onClear }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 mb-4">
      {fields.map(field => (
        <div key={field.key} className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">{field.label}</label>
          {field.type === 'select' ? (
            <select
              value={values[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={values[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={`Filter by ${field.label.toLowerCase()}`}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>
      ))}
      <button
        onClick={onClear}
        className="rounded-lg px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200"
      >
        Clear
      </button>
    </div>
  )
}
