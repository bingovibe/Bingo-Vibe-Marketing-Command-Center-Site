
'use client'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

interface DashboardStat {
  name: string
  value: string | number
  change: string
  changeType: 'increase' | 'decrease'
  trend: number[]
}

interface LiveMetrics {
  totalPosts: number
  activeCampaigns: number
  engagementRate: number
  reach: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
}

interface PerformanceIndicator {
  metric: string
  current: number
  target: number
  status: 'above' | 'below' | 'on-track'
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStat[]>([])
  
  // Fetch real-time metrics
  const { data: metrics, error: metricsError } = useSWR<LiveMetrics>(
    '/api/analytics/realtime', 
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  )
  
  // Fetch analytics overview 
  const { data: overview, error: overviewError } = useSWR(
    '/api/analytics/overview',
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )
  
  // Fetch campaign summaries
  const { data: campaigns } = useSWR('/api/campaigns/summary', fetcher, {
    refreshInterval: 60000 // Refresh every minute
  })

  // Fetch performance indicators
  const { data: performance } = useSWR('/api/metrics', fetcher, {
    refreshInterval: 30000
  })

  useEffect(() => {
    if (metrics && overview) {
      const newStats: DashboardStat[] = [
        {
          name: 'Total Posts',
          value: metrics.totalPosts || 0,
          change: overview.postsChange || '+0%',
          changeType: overview.postsChange?.startsWith('+') ? 'increase' : 'decrease',
          trend: overview.postsTrend || [0, 0, 0, 0, 0, 0, 0]
        },
        {
          name: 'Active Campaigns',
          value: metrics.activeCampaigns || 0,
          change: overview.campaignsChange || '+0',
          changeType: overview.campaignsChange?.startsWith('+') ? 'increase' : 'decrease',
          trend: overview.campaignsTrend || [0, 0, 0, 0, 0, 0, 0]
        },
        {
          name: 'Engagement Rate',
          value: `${(metrics.engagementRate || 0).toFixed(1)}%`,
          change: overview.engagementChange || '+0%',
          changeType: overview.engagementChange?.startsWith('+') ? 'increase' : 'decrease',
          trend: overview.engagementTrend || [0, 0, 0, 0, 0, 0, 0]
        },
        {
          name: 'Reach',
          value: formatNumber(metrics.reach || 0),
          change: overview.reachChange || '+0%',
          changeType: overview.reachChange?.startsWith('+') ? 'increase' : 'decrease',
          trend: overview.reachTrend || [0, 0, 0, 0, 0, 0, 0]
        },
        {
          name: 'Impressions',
          value: formatNumber(metrics.impressions || 0),
          change: overview.impressionsChange || '+0%',
          changeType: overview.impressionsChange?.startsWith('+') ? 'increase' : 'decrease',
          trend: overview.impressionsTrend || [0, 0, 0, 0, 0, 0, 0]
        },
        {
          name: 'Clicks',
          value: formatNumber(metrics.clicks || 0),
          change: overview.clicksChange || '+0%',
          changeType: overview.clicksChange?.startsWith('+') ? 'increase' : 'decrease',
          trend: overview.clicksTrend || [0, 0, 0, 0, 0, 0, 0]
        },
        {
          name: 'Conversions',
          value: metrics.conversions || 0,
          change: overview.conversionsChange || '+0%',
          changeType: overview.conversionsChange?.startsWith('+') ? 'increase' : 'decrease',
          trend: overview.conversionsTrend || [0, 0, 0, 0, 0, 0, 0]
        },
        {
          name: 'Revenue',
          value: `$${formatNumber(metrics.revenue || 0)}`,
          change: overview.revenueChange || '+$0',
          changeType: overview.revenueChange?.startsWith('+') ? 'increase' : 'decrease',
          trend: overview.revenueTrend || [0, 0, 0, 0, 0, 0, 0]
        }
      ]
      
      setStats(newStats)
    }
  }, [metrics, overview])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const MiniChart = ({ trend }: { trend: number[] }) => {
    const max = Math.max(...trend)
    const min = Math.min(...trend)
    const range = max - min || 1
    
    return (
      <div className="flex items-end space-x-1 h-8">
        {trend.map((value, index) => (
          <div
            key={index}
            className="bg-purple-200 w-1 rounded-t"
            style={{
              height: `${((value - min) / range) * 100}%` || '4px'
            }}
          />
        ))}
      </div>
    )
  }

  if (metricsError || overviewError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading dashboard metrics. Please try again.</p>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.slice(0, 4).map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
                <MiniChart trend={stat.trend} />
              </div>
            </div>
            {/* Real-time indicator */}
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Live Data
            </div>
          </div>
        ))}
      </div>

      {/* Extended Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.slice(4).map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
                <MiniChart trend={stat.trend} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Indicators */}
      {performance?.indicators && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performance.indicators.map((indicator: PerformanceIndicator, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">{indicator.metric}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    indicator.status === 'above' 
                      ? 'bg-green-100 text-green-800'
                      : indicator.status === 'below'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {indicator.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {indicator.current}
                </div>
                <div className="text-sm text-gray-600">
                  Target: {indicator.target}
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      indicator.status === 'above' ? 'bg-green-500' : 
                      indicator.status === 'below' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ 
                      width: `${Math.min((indicator.current / indicator.target) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Summaries */}
      {campaigns?.active && campaigns.active.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Campaign Performance</h3>
          <div className="space-y-3">
            {campaigns.active.slice(0, 3).map((campaign: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                  <p className="text-sm text-gray-600">{campaign.platform} • {campaign.status}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ${formatNumber(campaign.spent || 0)} / ${formatNumber(campaign.budget || 0)}
                  </div>
                  <div className="text-sm text-green-600">
                    ROI: {((campaign.roi || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
