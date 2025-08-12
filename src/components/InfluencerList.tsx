'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { toast } from 'react-hot-toast'

interface Influencer {
  id: string
  name: string
  email: string
  platform: string
  handle: string
  followerCount: number
  engagementRate: number
  niche?: string
  location?: string
  tags: string[]
  notes?: string
  rating: number
  isBlacklisted: boolean
  lastContactDate?: string
  createdAt: string
  _count: {
    outreachEmails: number
  }
}

interface Props {
  onSelectInfluencer?: (influencer: Influencer) => void
  onStartOutreach?: (influencers: Influencer[]) => void
  selectedInfluencers?: string[]
  selectable?: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function InfluencerList({ 
  onSelectInfluencer, 
  onStartOutreach, 
  selectedInfluencers = [],
  selectable = false 
}: Props) {
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [minFollowers, setMinFollowers] = useState('')
  const [maxFollowers, setMaxFollowers] = useState('')
  const [minEngagement, setMinEngagement] = useState('')
  const [nicheFilter, setNicheFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null)
  const [localSelectedInfluencers, setLocalSelectedInfluencers] = useState<string[]>([])

  // Build query string for filters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (platformFilter && platformFilter !== 'all') params.set('platform', platformFilter)
    if (minFollowers) params.set('minFollowers', minFollowers)
    if (maxFollowers) params.set('maxFollowers', maxFollowers)
    if (minEngagement) params.set('minEngagement', minEngagement)
    if (nicheFilter) params.set('niche', nicheFilter)
    return params.toString()
  }, [search, platformFilter, minFollowers, maxFollowers, minEngagement, nicheFilter])

  const { data, error, isLoading, mutate } = useSWR(
    `/api/influencers${queryParams ? `?${queryParams}` : ''}`,
    fetcher
  )

  const effectiveSelectedInfluencers = selectable 
    ? localSelectedInfluencers 
    : selectedInfluencers

  const handleSelectInfluencer = (influencerId: string) => {
    if (selectable) {
      setLocalSelectedInfluencers(prev =>
        prev.includes(influencerId)
          ? prev.filter(id => id !== influencerId)
          : [...prev, influencerId]
      )
    }
  }

  const handleSelectAll = () => {
    if (!data?.influencers) return
    
    if (selectable) {
      const allIds = data.influencers.map((inf: Influencer) => inf.id)
      setLocalSelectedInfluencers(
        effectiveSelectedInfluencers.length === allIds.length ? [] : allIds
      )
    }
  }

  const handleDeleteInfluencer = async (influencerId: string) => {
    if (!confirm('Are you sure you want to delete this influencer?')) return

    try {
      const response = await fetch(`/api/influencers/${influencerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Influencer deleted successfully')
        mutate()
      } else {
        throw new Error('Failed to delete influencer')
      }
    } catch (error) {
      toast.error('Failed to delete influencer')
      console.error('Delete error:', error)
    }
  }

  const handleBlacklistToggle = async (influencer: Influencer) => {
    try {
      const response = await fetch(`/api/influencers/${influencer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlacklisted: !influencer.isBlacklisted }),
      })

      if (response.ok) {
        toast.success(`Influencer ${influencer.isBlacklisted ? 'removed from' : 'added to'} blacklist`)
        mutate()
      } else {
        throw new Error('Failed to update influencer')
      }
    } catch (error) {
      toast.error('Failed to update influencer')
      console.error('Update error:', error)
    }
  }

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    if (rating >= 2) return 'text-orange-600'
    return 'text-red-600'
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
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
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Influencers</h3>
          <p className="text-red-600">Failed to load influencer data. Please try again.</p>
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

  const influencers = data?.influencers || []
  const hasSelection = effectiveSelectedInfluencers.length > 0

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Influencer Database</h3>
            <p className="text-sm text-gray-500">{data?.total || 0} total influencers</p>
          </div>
          <div className="flex items-center space-x-3">
            {hasSelection && (
              <button
                onClick={() => {
                  const selected = influencers.filter((inf: Influencer) => 
                    effectiveSelectedInfluencers.includes(inf.id)
                  )
                  onStartOutreach?.(selected)
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Start Outreach ({effectiveSelectedInfluencers.length})
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Influencer
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search influencers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="TIKTOK">TikTok</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
            </select>
          </div>
          <div>
            <input
              type="number"
              placeholder="Min followers"
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Max followers"
              value={maxFollowers}
              onChange={(e) => setMaxFollowers(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Niche/Category"
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={influencers.length > 0 && effectiveSelectedInfluencers.length === influencers.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Influencer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform & Handle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Followers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
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
            {influencers.length === 0 ? (
              <tr>
                <td 
                  colSpan={selectable ? 8 : 7} 
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Influencers Found</h3>
                  <p className="text-gray-500">
                    {search || platformFilter !== 'all' || minFollowers || maxFollowers || nicheFilter 
                      ? 'No influencers match your current filters. Try adjusting your search criteria.'
                      : 'Get started by adding your first influencer to the database.'
                    }
                  </p>
                </td>
              </tr>
            ) : (
              influencers.map((influencer: Influencer) => (
                <tr 
                  key={influencer.id}
                  className={`hover:bg-gray-50 ${
                    influencer.isBlacklisted ? 'bg-red-50 opacity-75' : ''
                  }`}
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={effectiveSelectedInfluencers.includes(influencer.id)}
                        onChange={() => handleSelectInfluencer(influencer.id)}
                        disabled={influencer.isBlacklisted}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {influencer.name}
                          {influencer.isBlacklisted && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Blacklisted
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{influencer.email}</div>
                        {influencer.niche && (
                          <div className="text-xs text-gray-400">{influencer.niche}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{influencer.platform}</div>
                    <div className="text-sm text-gray-500">@{influencer.handle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFollowers(influencer.followerCount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(influencer.engagementRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {renderStars(influencer.rating || 0)}
                      <span className={`ml-2 text-sm ${getRatingColor(influencer.rating || 0)}`}>
                        {influencer.rating || 0}/5
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {influencer._count.outreachEmails} emails
                    {influencer.lastContactDate && (
                      <div className="text-xs text-gray-500">
                        Last: {new Date(influencer.lastContactDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectInfluencer?.(influencer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setEditingInfluencer(influencer)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleBlacklistToggle(influencer)}
                        className={`${
                          influencer.isBlacklisted 
                            ? 'text-green-600 hover:text-green-900' 
                            : 'text-yellow-600 hover:text-yellow-900'
                        }`}
                      >
                        {influencer.isBlacklisted ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => handleDeleteInfluencer(influencer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination placeholder */}
      {data?.total > 50 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700 text-center">
            Showing {influencers.length} of {data.total} influencers
            {/* TODO: Add proper pagination controls */}
          </div>
        </div>
      )}
    </div>
  )
}
