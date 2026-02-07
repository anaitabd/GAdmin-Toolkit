const colorMap = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-600',
}

interface StatusBadgeProps {
  active?: boolean
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray'
  label?: string
}

export default function StatusBadge({ active, color, label }: StatusBadgeProps) {
  const resolvedColor = color || (active ? 'green' : 'gray')
  const resolvedLabel = label || (active ? 'Active' : 'Inactive')

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorMap[resolvedColor]}`}
    >
      {resolvedLabel}
    </span>
  )
}
