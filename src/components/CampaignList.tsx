'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'react-hot-toast'

interface CampaignWithMetrics {
  id: string
  name: string
  description?: string
  status: string
  budget?: number
  spent?: number
  revenue?: number
  startDate?: string
  endDate?: string
  createdAt: string
  
  // Calculated metrics
  roi: number
  remainingBudget: number
  daysRemaining?: number
  totalPosts: number
  totalViews: number
  totalEngagement: number
  averageEngagementRate: number
  outreachCount: number
  collaborationCount: number
}

interface Props {
  onSelectCampaign?: (campaign: CampaignWithMetrics) => void
  onViewMetrics?: (campaignId: string) => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CampaignList({ onSelectCampaign, onViewMetrics }: Props) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithMetrics | null>(null)

  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
  })

  const { data, error, isLoading, mutate } = useSWR('/api/campaigns', fetcher)
  const campaigns: CampaignWithMetrics[] = data?.campaigns || []

  // Filter campaigns based on status and search
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = statusFilter === 'all' || campaign.status.toLowerCase() === statusFilter
    const matchesSearch = !search || 
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      (campaign.description && campaign.description.toLowerCase().includes(search.toLowerCase()))
    
    return matchesStatus && matchesSearch
  })

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) {
      toast.error('Campaign name is required')
      return
    }

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCampaign,
          budget: newCampaign.budget ? parseFloat(newCampaign.budget) : null,
          startDate: newCampaign.startDate || null,
          endDate: newCampaign.endDate || null,
        }),
      })

      if (response.ok) {
        toast.success('Campaign created successfully')
        mutate()
        setNewCampaign({ name: '', description: '', budget: '', startDate: '', endDate: '' })
        setShowCreateModal(false)
      } else {
        throw new Error('Failed to create campaign')
      }
    } catch (error) {
      toast.error('Failed to create campaign')
      console.error('Create campaign error:', error)
    }
  }

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete the campaign "${campaignName}"?`)) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Campaign deleted successfully')
        mutate()
      } else {
        throw new Error('Failed to delete campaign')
      }
    } catch (error) {
      toast.error('Failed to delete campaign')
      console.error('Delete campaign error:', error)
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
      PLANNING: { label: 'Planning', color: 'bg-blue-100 text-blue-800' },
      PAUSED: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    }
    return configs[status as keyof typeof configs] || configs.PLANNING
  }

  const getBudgetUtilization = (campaign: CampaignWithMetrics) => {
    if (!campaign.budget) return 0
    return ((campaign.spent || 0) / campaign.budget) * 100
  }

  const getROIColor = (roi: number) => {
    if (roi > 50) return 'text-green-600'
    if (roi > 0) return 'text-blue-600'
    if (roi > -25) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Campaigns</h3>
          <p className="text-red-600">Failed to load campaign data. Please try again.</p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Campaign Management</h3>
            <p className="text-sm text-gray-500">{data?.total || 0} total campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            New Campaign
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status & Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget & ROI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outreach
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Found</h3>
                  <p className="text-gray-500">
                    {search || statusFilter !== 'all' 
                      ? 'No campaigns match your current filters. Try adjusting your search criteria.'
                      : 'Get started by creating your first marketing campaign.'
                    }
                  </p>
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((campaign) => {
                const statusConfig = getStatusConfig(campaign.status)
                const budgetUtilization = getBudgetUtilization(campaign)
                
                return (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-gray-500">
                            {campaign.description.length > 50 
                              ? `${campaign.description.substring(0, 50)}...` 
                              : campaign.description
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <div className="text-xs text-gray-500">
                          {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                        </div>
                        {campaign.daysRemaining !== undefined && campaign.daysRemaining > 0 && (
                          <div className="text-xs text-blue-600">
                            {campaign.daysRemaining} days left
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(campaign.budget)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Spent: {formatCurrency(campaign.spent)}
                        </div>
                        <div className={`text-xs font-medium ${getROIColor(campaign.roi)}`}>
                          ROI: {campaign.roi > 0 ? '+' : ''}{campaign.roi.toFixed(1)}%
                        </div>
                        {campaign.budget && campaign.budget > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                budgetUtilization > 90 ? 'bg-red-500' :
                                budgetUtilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{campaign.totalPosts} posts</div>
                        <div className="text-xs text-gray-500">
                          {campaign.totalViews.toLocaleString()} views
                        </div>
                        <div className="text-xs text-gray-500">
                          {campaign.averageEngagementRate.toFixed(1)}% engagement
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{campaign.outreachCount} sent</div>
                        <div className="text-xs text-green-600">
                          {campaign.collaborationCount} collaborating
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewMetrics?.(campaign.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Metrics
                        </button>
                        <button
                          onClick={() => onSelectCampaign?.(campaign)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setEditingCampaign(campaign)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create New Campaign</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Back to School Bingo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the campaign..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  step="0.01"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
