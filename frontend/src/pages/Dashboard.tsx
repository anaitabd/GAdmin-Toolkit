import { UsersIcon, PaperAirplaneIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import StatCard from '../components/ui/StatCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useUsers } from '../hooks/useUsers'
import { useEmailLogStats } from '../hooks/useEmailLogs'
import { useBounceLogStats } from '../hooks/useBounceLogs'

export default function Dashboard() {
  const { data: usersData, isLoading: usersLoading } = useUsers()
  const { data: emailStats, isLoading: emailLoading } = useEmailLogStats()
  const { data: bounceStats, isLoading: bounceLoading } = useBounceLogStats()

  if (usersLoading || emailLoading || bounceLoading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={usersData?.count ?? 0}
          icon={UsersIcon}
          color="text-indigo-600"
        />
        <StatCard
          title="Emails Sent"
          value={emailStats?.data?.sent ?? 0}
          icon={PaperAirplaneIcon}
          color="text-green-600"
        />
        <StatCard
          title="Failed Emails"
          value={emailStats?.data?.failed ?? 0}
          icon={ExclamationCircleIcon}
          color="text-red-600"
        />
        <StatCard
          title="Bounced Emails"
          value={bounceStats?.data?.total ?? 0}
          icon={ExclamationTriangleIcon}
          color="text-amber-600"
        />
      </div>
    </div>
  )
}
