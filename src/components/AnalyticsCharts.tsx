
'use client'
import { useState, useMemo } from 'react'
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import useSWR from 'swr'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface Props {
  dateRange: DateRange | null;
  selectedPlatforms: string[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AnalyticsCharts({ dateRange, selectedPlatforms }: Props) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  // Build query string for date range
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (dateRange?.startDate) params.set('startDate', dateRange.startDate)
    if (dateRange?.endDate) params.set('endDate', dateRange.endDate)
    return params.toString()
  }, [dateRange])

  const { data: analyticsData, error: analyticsError, isLoading: analyticsLoading } = useSWR(
    `/api/analytics/overview${queryParams ? `?${queryParams}` : ''}`,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )

  const { data: realtimeData, error: realtimeError } = useSWR(
    '/api/analytics/realtime',
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10 seconds
  )

  // Loading state
  if (analyticsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (analyticsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Analytics</h3>
        <p className="text-red-600">Failed to load analytics data. Please try again.</p>
      </div>
    )
  }

  // No data state
  if (!analyticsData || analyticsData.totalPosts === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
        <p className="text-gray-600">
          Start creating and publishing content to see your analytics data here.
        </p>
      </div>
    )
  }

  // Filter platform data based on selection
  const filteredPlatformData = selectedPlatforms && selectedPlatforms.length > 0
    ? analyticsData.platformBreakdown.filter((platform: any) => 
        selectedPlatforms.includes(platform.platform)
      )
    : analyticsData.platformBreakdown

  // Engagement trends over time
  const engagementData = {
    labels: analyticsData.timeSeriesData.map((item: any) => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Views',
        data: analyticsData.timeSeriesData.map((item: any) => item.views),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Engagement',
        data: analyticsData.timeSeriesData.map((item: any) => item.engagement),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  }

  // Platform performance
  const platformColors = {
    YOUTUBE: 'rgba(255, 0, 0, 0.8)',
    TIKTOK: 'rgba(0, 0, 0, 0.8)',
    INSTAGRAM: 'rgba(225, 48, 108, 0.8)',
    FACEBOOK: 'rgba(24, 119, 242, 0.8)',
  }

  const platformData = {
    labels: filteredPlatformData.map((item: any) => item.platform),
    datasets: [
      {
        label: 'Posts',
        data: filteredPlatformData.map((item: any) => item.posts),
        backgroundColor: filteredPlatformData.map((item: any) => 
          platformColors[item.platform as keyof typeof platformColors] || 'rgba(107, 114, 128, 0.8)'
        ),
      }
    ]
  }

  const platformEngagementData = {
    labels: filteredPlatformData.map((item: any) => item.platform),
    datasets: [
      {
        label: 'Total Engagement',
        data: filteredPlatformData.map((item: any) => item.engagement),
        backgroundColor: filteredPlatformData.map((item: any) => 
          platformColors[item.platform as keyof typeof platformColors] || 'rgba(107, 114, 128, 0.8)'
        ),
      }
    ]
  }

  // Top performing content
  const topPostsData = {
    labels: analyticsData.topPerformingPosts.slice(0, 5).map((post: any) => 
      post.title.length > 30 ? post.title.substring(0, 30) + '...' : post.title
    ),
    datasets: [
      {
        label: 'Engagement',
        data: analyticsData.topPerformingPosts.slice(0, 5).map((post: any) => post.engagement),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const simpleChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Analytics Overview</h2>
          <p className="text-sm text-gray-600">
            {analyticsData.totalPosts} total posts • {analyticsData.engagementRate.toFixed(2)}% avg engagement rate
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {realtimeData && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Today: {realtimeData.todayViews} views</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>{realtimeData.todayEngagement} engagements</span>
              </div>
            </div>
          )}
          
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trends */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Trends Over Time</h3>
          {chartType === 'line' ? (
            <Line data={engagementData} options={chartOptions} />
          ) : (
            <Bar data={engagementData} options={chartOptions} />
          )}
        </div>
        
        {/* Platform Posts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Posts by Platform</h3>
          <Bar data={platformData} options={simpleChartOptions} />
        </div>
        
        {/* Platform Engagement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement by Platform</h3>
          <Doughnut data={platformEngagementData} options={simpleChartOptions} />
        </div>
        
        {/* Top Performing Posts */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Posts</h3>
          <Bar 
            data={topPostsData} 
            options={{
              ...simpleChartOptions,
              indexAxis: 'y' as const,
              plugins: {
                ...simpleChartOptions.plugins,
                legend: {
                  display: false,
                },
              },
            }} 
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{analyticsData.totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Views</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{analyticsData.totalEngagement.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Engagement</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{analyticsData.averageViews.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Avg Views per Post</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{analyticsData.engagementRate.toFixed(2)}%</div>
          <div className="text-sm text-gray-600">Engagement Rate</div>
        </div>
      </div>
    </div>
  )
}
