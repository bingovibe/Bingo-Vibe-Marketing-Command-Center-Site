'use client'

import { useState, useMemo } from 'react'
import AnalyticsCharts from '@/components/AnalyticsCharts'
import MetricsOverview from '@/components/MetricsOverview'

interface DateRange {
  startDate: string;
  endDate: string;
}

const platforms = [
  { id: 'YOUTUBE', name: 'YouTube', color: 'bg-red-500' },
  { id: 'TIKTOK', name: 'TikTok', color: 'bg-black' },
  { id: 'INSTAGRAM', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'FACEBOOK', name: 'Facebook', color: 'bg-blue-600' },
]

const dateRangePresets = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
]

export default function AnalyticsPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Handle platform selection
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const selectAllPlatforms = () => {
    setSelectedPlatforms(platforms.map(p => p.id))
  }

  const deselectAllPlatforms = () => {
    setSelectedPlatforms([])
  }

  // Handle date range presets
  const selectDatePreset = (days: number) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    })
    setShowCustomDateRange(false)
  }

  // Handle custom date range
  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setDateRange({
        startDate: customStartDate,
        endDate: customEndDate,
      })
      setShowCustomDateRange(false)
    }
  }

  const clearDateRange = () => {
    setDateRange(null)
    setCustomStartDate('')
    setCustomEndDate('')
    setShowCustomDateRange(false)
  }

  // Format date range for display
  const formatDateRange = (range: DateRange) => {
    const start = new Date(range.startDate).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    })
    const end = new Date(range.endDate).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    })
    return `${start} - ${end}`
  }

  const selectedPlatformNames = useMemo(() => {
    if (selectedPlatforms.length === 0) return 'All Platforms'
    if (selectedPlatforms.length === platforms.length) return 'All Platforms'
    return selectedPlatforms
      .map(id => platforms.find(p => p.id === id)?.name)
      .join(', ')
  }, [selectedPlatforms])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track performance across all platforms</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Export Button - Placeholder for now */}
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Export Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-6">
          {/* Platform Filters */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Platforms ({selectedPlatformNames})
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAllPlatforms}
                className="px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Select All
              </button>
              <button
                onClick={deselectAllPlatforms}
                className="px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
              {platforms.map(platform => (
                <label key={platform.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">{platform.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Range {dateRange && `(${formatDateRange(dateRange)})`}
            </label>
            <div className="flex flex-wrap gap-2">
              {dateRangePresets.map(preset => (
                <button
                  key={preset.days}
                  onClick={() => selectDatePreset(preset.days)}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustomDateRange(!showCustomDateRange)}
                className="px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Custom
              </button>
              {dateRange && (
                <button
                  onClick={clearDateRange}
                  className="px-3 py-1 text-xs border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Custom Date Range Controls */}
        {showCustomDateRange && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={applyCustomDateRange}
                disabled={!customStartDate || !customEndDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
              <button
                onClick={() => setShowCustomDateRange(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Content */}
      <MetricsOverview dateRange={dateRange} selectedPlatforms={selectedPlatforms} />
      <AnalyticsCharts 
        dateRange={dateRange} 
        selectedPlatforms={selectedPlatforms.length > 0 ? selectedPlatforms : undefined}
      />
    </div>
  )
}
