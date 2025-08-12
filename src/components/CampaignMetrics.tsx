'use client'

import useSWR from 'swr'

interface Props {
  campaignId?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CampaignMetrics({ campaignId }: Props) {
  const { data, error, isLoading } = useSWR(
    '/api/campaigns/summary',
    fetcher,
    { refreshInterval: 30000 }
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load campaign metrics</p>
      </div>
    )
  }

  const metrics = [
    { 
      name: 'Total Budget', 
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.totalBudget),
      change: `${data.activeCampaigns} active`,
      color: 'text-blue-600'
    },
    { 
      name: 'Total Spent', 
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.totalSpent),
      change: `${((data.totalSpent / data.totalBudget) * 100).toFixed(1)}% used`,
      color: 'text-orange-600'
    },
    { 
      name: 'Revenue', 
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.totalRevenue),
      change: `${data.overallROI > 0 ? '+' : ''}${data.overallROI.toFixed(1)}% ROI`,
      color: data.overallROI > 0 ? 'text-green-600' : 'text-red-600'
    },
    { 
      name: 'Campaigns', 
      value: data.totalCampaigns.toString(),
      change: `${data.activeCampaigns} active`,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div key={metric.name} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            <span className={`text-sm ${metric.color}`}>{metric.change}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
