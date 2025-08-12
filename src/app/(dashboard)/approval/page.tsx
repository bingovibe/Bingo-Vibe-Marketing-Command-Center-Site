'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'

interface ContentItem {
  id: string
  type: 'post' | 'campaign' | 'story'
  character: string
  platform: string
  content: string
  images?: string[]
  scheduledDate?: string
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  createdAt: string
  updatedAt: string
  feedback?: string
  priority: 'low' | 'medium' | 'high'
  campaign?: string
  tags?: string[]
  metrics?: {
    expectedReach: number
    expectedEngagement: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  changes_requested: 'bg-orange-100 text-orange-800 border-orange-200'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}

export default function ApprovalPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [feedback, setFeedback] = useState('')
  const [bulkAction, setBulkAction] = useState<string>('')

  // Fetch content for approval
  const { data, error, mutate } = useSWR<{ items: ContentItem[] }>(
    `/api/approvals?status=${filterStatus}&platform=${filterPlatform}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const items = data?.items || []

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item.id))
    }
  }

  const handleApprove = async (itemId: string, itemFeedback?: string) => {
    try {
      await fetch(`/api/approvals/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'approved',
          feedback: itemFeedback || ''
        })
      })
      mutate()
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    } catch (error) {
      console.error('Error approving content:', error)
    }
  }

  const handleReject = async (itemId: string, itemFeedback: string) => {
    try {
      await fetch(`/api/approvals/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'rejected',
          feedback: itemFeedback
        })
      })
      mutate()
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    } catch (error) {
      console.error('Error rejecting content:', error)
    }
  }

  const handleRequestChanges = async (itemId: string, itemFeedback: string) => {
    try {
      await fetch(`/api/approvals/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'changes_requested',
          feedback: itemFeedback
        })
      })
      mutate()
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    } catch (error) {
      console.error('Error requesting changes:', error)
    }
  }

  const handleEdit = async (item: ContentItem, newContent: string) => {
    try {
      await fetch(`/api/drafts/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })
      mutate()
      setEditingItem(null)
    } catch (error) {
      console.error('Error editing content:', error)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.length === 0) return

    try {
      await Promise.all(
        selectedItems.map(itemId => 
          fetch(`/api/approvals/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: bulkAction,
              feedback: feedback || ''
            })
          })
        )
      )
      mutate()
      setSelectedItems([])
      setBulkAction('')
      setFeedback('')
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading content for approval. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Approval</h1>
        <p className="text-gray-600">Review, edit, and approve content before publishing</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="changes_requested">Changes Requested</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Platform:</label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Platforms</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedItems.length} selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="">Bulk Action</option>
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
                <option value="changes_requested">Request Changes</option>
              </select>
              <input
                type="text"
                placeholder="Feedback (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm w-48"
              />
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="space-y-4">
        {/* Select All */}
        {items.length > 0 && (
          <div className="flex items-center space-x-2 pb-4 border-b">
            <input
              type="checkbox"
              checked={selectedItems.length === items.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">
              Select All ({items.length} items)
            </span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content to approve</h3>
            <p className="text-gray-600">All content has been processed for the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.character} - {item.platform}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.type} • {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[item.priority]}`}>
                        {item.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${statusColors[item.status]}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="p-4">
                  {editingItem?.id === item.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingItem.content}
                        onChange={(e) => setEditingItem({...editingItem, content: e.target.value})}
                        className="w-full h-32 border border-gray-300 rounded-md p-3 text-sm"
                        placeholder="Edit content..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(editingItem, editingItem.content)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.content}</p>
                      </div>
                      
                      {/* Images */}
                      {item.images && item.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {item.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Content image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md border border-gray-200"
                            />
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {item.campaign && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            {item.campaign}
                          </span>
                        )}
                        {item.tags?.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            #{tag}
                          </span>
                        ))}
                        {item.scheduledDate && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            📅 {new Date(item.scheduledDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Metrics */}
                      {item.metrics && (
                        <div className="flex space-x-4 text-xs text-gray-600">
                          <span>Expected Reach: {item.metrics.expectedReach.toLocaleString()}</span>
                          <span>Expected Engagement: {item.metrics.expectedEngagement.toFixed(1)}%</span>
                        </div>
                      )}

                      {/* Previous Feedback */}
                      {item.feedback && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">Feedback:</span> {item.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const feedbackText = prompt('Feedback for rejection:')
                          if (feedbackText !== null) {
                            handleReject(item.id, feedbackText)
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          const feedbackText = prompt('Feedback for changes (optional):')
                          if (feedbackText !== null) {
                            handleRequestChanges(item.id, feedbackText)
                          }
                        }}
                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                      >
                        Request Changes
                      </button>
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
