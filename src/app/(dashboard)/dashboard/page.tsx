
import DashboardStats from '@/components/DashboardStats'
import RecentActivity from '@/components/RecentActivity'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketing Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your Bingo Vibe Marketing Command Center</p>
      </div>
      
      <DashboardStats />
      <RecentActivity />
    </div>
  )
}
