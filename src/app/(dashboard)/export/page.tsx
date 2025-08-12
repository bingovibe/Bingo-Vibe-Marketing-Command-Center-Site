'use client'
import { useState } from 'react'
import { universalExport, scheduleExport } from '@/utils/export'

interface ExportForm {
  type: 'content' | 'analytics' | 'campaigns' | 'influencers'
  format: 'csv' | 'json' | 'pdf'
  dateRange: {
    start: string
    end: string
  }
  customFields: string[]
  platforms: string[]
  campaigns: string[]
  metrics: string[]
  includeHeaders: boolean
  scheduled: boolean
  scheduleFrequency: 'daily' | 'weekly' | 'monthly'
  email: string
}

const exportTypes = {
  content: {
    name: 'Social Media Content',
    description: 'Export posts, schedules, and engagement data',
    icon: '📱',
    fields: ['id', 'character', 'platform', 'content', 'status', 'scheduledDate', 'publishedDate', 'engagement', 'reach', 'clicks']
  },
  analytics: {
    name: 'Analytics Report', 
    description: 'Export performance metrics and analytics data',
    icon: '📊',
    fields: ['date', 'platform', 'reach', 'impressions', 'engagement', 'clicks', 'conversions', 'revenue']
  },
  campaigns: {
    name: 'Campaign Data',
    description: 'Export campaign performance and ROI data',
    icon: '🚀',
    fields: ['id', 'name', 'status', 'budget', 'spent', 'roi', 'startDate', 'endDate', 'platform', 'character']
  },
  influencers: {
    name: 'Influencer Lists',
    description: 'Export influencer contact and performance data',
    icon: '👥',
    fields: ['id', 'name', 'email', 'platform', 'followers', 'engagementRate', 'status', 'lastContact', 'campaigns']
  }
}

const platforms = ['TikTok', 'Instagram', 'Facebook', 'LinkedIn']
const metrics = ['reach', 'impressions', 'engagement', 'clicks', 'conversions', 'revenue']

export default function ExportPage() {
  const [form, setForm] = useState<ExportForm>({
    type: 'content',
    format: 'csv',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    customFields: [],
    platforms: [],
    campaigns: [],
    metrics: [],
    includeHeaders: true,
    scheduled: false,
    scheduleFrequency: 'weekly',
    email: 'admin@bingovibe.info'
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<{ success: boolean; message: string } | null>(null)

  const handleFieldChange = (field: keyof ExportForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayFieldToggle = (field: 'customFields' | 'platforms' | 'campaigns' | 'metrics', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportStatus(null)

    try {
      const options = {
        customFields: form.customFields.length > 0 ? form.customFields : undefined,
        platforms: form.platforms.length > 0 ? form.platforms : undefined,
        campaigns: form.campaigns.length > 0 ? form.campaigns : undefined,
        metrics: form.metrics.length > 0 ? form.metrics : undefined,
        dateRange: {
          start: new Date(form.dateRange.start),
          end: new Date(form.dateRange.end)
        },
        includeHeaders: form.includeHeaders
      }

      if (form.scheduled) {
        const result = await scheduleExport(form.type, form.scheduleFrequency, form.email, options)
        setExportStatus(result)
      } else {
        const result = await universalExport(form.type, form.format, options)
        setExportStatus(result)
      }
    } catch (error) {
      setExportStatus({ success: false, message: 'Export failed. Please try again.' })
    } finally {
      setIsExporting(false)
    }
  }

  const currentTypeInfo = exportTypes[form.type]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Export Tools</h1>
        <p className="text-gray-600">Export your marketing data in various formats</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Export Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Export Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(exportTypes).map(([key, type]) => (
                <div
                  key={key}
                  onClick={() => handleFieldChange('type', key)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    form.type === key 
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{type.name}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Format</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'csv', name: 'CSV', description: 'Comma-separated values (Excel compatible)' },
                { key: 'json', name: 'JSON', description: 'Structured data format' },
                { key: 'pdf', name: 'PDF', description: 'Formatted report document' }
              ].map(format => (
                <div
                  key={format.key}
                  onClick={() => handleFieldChange('format', format.key)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    form.format === format.key
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium text-gray-900">{format.name}</h4>
                  <p className="text-sm text-gray-600">{format.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={form.dateRange.start}
                  onChange={(e) => handleFieldChange('dateRange', { ...form.dateRange, start: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={form.dateRange.end}
                  onChange={(e) => handleFieldChange('dateRange', { ...form.dateRange, end: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Fields to Export</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {currentTypeInfo.fields.map(field => (
                <label key={field} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.customFields.includes(field)}
                    onChange={() => handleArrayFieldToggle('customFields', field)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
            {form.customFields.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">All fields will be included if none selected</p>
            )}
          </div>

          {/* Platform Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter by Platform</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map(platform => (
                <label key={platform} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.platforms.includes(platform)}
                    onChange={() => handleArrayFieldToggle('platforms', platform)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{platform}</span>
                </label>
              ))}
            </div>
            {form.platforms.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">All platforms will be included if none selected</p>
            )}
          </div>

          {/* Metrics Filter (for analytics) */}
          {form.type === 'analytics' && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {metrics.map(metric => (
                  <label key={metric} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.metrics.includes(metric)}
                      onChange={() => handleArrayFieldToggle('metrics', metric)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 capitalize">{metric}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.includeHeaders}
                  onChange={(e) => handleFieldChange('includeHeaders', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Include column headers</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.scheduled}
                  onChange={(e) => handleFieldChange('scheduled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Schedule recurring export</span>
              </label>
            </div>
          </div>

          {/* Scheduled Export Options */}
          {form.scheduled && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Schedule Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <select
                    value={form.scheduleFrequency}
                    onChange={(e) => handleFieldChange('scheduleFrequency', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="admin@bingovibe.info"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Export Status */}
          {exportStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              exportStatus.success 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="text-sm font-medium">
                {exportStatus.success ? '✅' : '❌'} {exportStatus.message}
              </p>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting 
                ? 'Exporting...' 
                : form.scheduled 
                ? 'Schedule Export' 
                : `Export ${form.format.toUpperCase()}`
              }
            </button>
          </div>
        </div>
      </div>

      {/* Export History */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Exports</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">📂</div>
            <p>Export history will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
