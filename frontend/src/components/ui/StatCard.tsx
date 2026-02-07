import type { ElementType } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ElementType
  color?: string
}

export default function StatCard({ title, value, icon: Icon, color = 'text-indigo-600' }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 ${color}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
