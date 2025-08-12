
'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import moment from 'moment'

interface Activity {
  id: string
  type: 'post_published' | 'campaign_created' | 'content_approved' | 'influencer_response' | 'system_notification' | 'user_action'
  action: string
  character?: string
  platform?: string
  campaign?: string
  user?: string
  timestamp: string
  details?: any
  priority: 'low' | 'medium' | 'high'
  read: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const activityIcons = {
  post_published: '📱',
  campaign_created: '🚀',
  content_approved: '✅',
  influencer_response: '💬',
  system_notification: '🔔',
  user_action: '👤'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // Fetch activities with real-time updates
  const { data, error, mutate } = useSWR<{ activities: Activity[] }>(
    '/api/notifications/recent',
    fetcher,
    { 
      refreshInterval: 10000, // Refresh every 10 seconds
      onSuccess: (data) => {
        if (data?.activities) {
          setActivities(data.activities)
        }
      }
    }
  )

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/notifications`)
      
      ws.onmessage = (event) => {
        try {
          const newActivity = JSON.parse(event.data)
          setActivities(prev => [newActivity, ...prev.slice(0, 49)]) // Keep last 50 activities
          mutate() // Refresh the data
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      return () => ws.close()
    }
  }, [mutate])

  const markAsRead = async (activityId: string) => {
    try {
      await fetch(`/api/notifications/${activityId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, read: true }
            : activity
        )
      )
      mutate()
    } catch (error) {
      console.error('Error marking activity as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      
      setActivities(prev => 
        prev.map(activity => ({ ...activity, read: true }))
      )
      mutate()
    } catch (error) {
      console.error('Error marking all activities as read:', error)
    }
  }

  const filteredActivities = activities.filter(activity => {
    if (showUnreadOnly && activity.read) return false
    if (filter === 'all') return true
    return activity.type === filter
  })

  const unreadCount = activities.filter(activity => !activity.read).length

  const getActivityDescription = (activity: Activity) => {
    switch (activity.type) {
      case 'post_published':
        return `New post published by ${activity.character} on ${activity.platform}`
      case 'campaign_created':
        return `Campaign "${activity.campaign}" created`
      case 'content_approved':
        return `Content approved for ${activity.character} on ${activity.platform}`
      case 'influencer_response':
        return `Influencer responded to outreach for ${activity.campaign}`
      case 'system_notification':
        return activity.action
      case 'user_action':
        return `${activity.user} ${activity.action}`
      default:
        return activity.action
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-red-600">
            Error loading activities. Please try again.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                {unreadCount} unread
              </span>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Live Updates
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-3 py-1 text-sm rounded ${
                showUnreadOnly 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <div className="mt-3 flex space-x-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'post_published', label: 'Posts' },
            { key: 'campaign_created', label: 'Campaigns' },
            { key: 'content_approved', label: 'Approvals' },
            { key: 'influencer_response', label: 'Influencers' },
            { key: 'system_notification', label: 'System' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-3 py-1 text-sm rounded ${
                filter === filterOption.key
                  ? 'bg-purple-100 text-purple-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-6">
        {!activities.length ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-500">No recent activity to display</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredActivities.slice(0, 20).map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start space-x-4 p-3 rounded-lg transition-colors ${
                  activity.read 
                    ? 'hover:bg-gray-50' 
                    : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400'
                }`}
              >
                <div className="flex-shrink-0 text-2xl">
                  {activityIcons[activity.type] || '📋'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getActivityDescription(activity)}
                      </p>
                      
                      {activity.details && (
                        <div className="mt-1 text-sm text-gray-600">
                          {typeof activity.details === 'string' 
                            ? activity.details 
                            : JSON.stringify(activity.details)
                          }
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-3">
                        <span className="text-sm text-gray-500">
                          {moment(activity.timestamp).fromNow()}
                        </span>
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[activity.priority]}`}>
                          {activity.priority}
                        </span>
                        
                        {activity.character && (
                          <span className="text-xs text-gray-500">
                            {activity.character}
                          </span>
                        )}
                        
                        {activity.platform && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {activity.platform}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!activity.read && (
                      <button
                        onClick={() => markAsRead(activity.id)}
                        className="flex-shrink-0 ml-4 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredActivities.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-500">No activities match your current filter</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
