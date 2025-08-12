
'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'

interface SocialConnection {
  id: string
  platform: string
  accountName: string
  accountId: string
  isConnected: boolean
  lastSync: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  permissions: string[]
  status: 'active' | 'expired' | 'error'
  metrics?: {
    followers: number
    posts: number
    engagement: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const platformInfo = {
  TikTok: {
    name: 'TikTok',
    icon: '📱',
    color: 'bg-black',
    description: 'Connect your TikTok account to post videos and track analytics'
  },
  Instagram: {
    name: 'Instagram',
    icon: '📸',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Connect your Instagram account for posts, stories, and reels'
  },
  Facebook: {
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600',
    description: 'Connect your Facebook page to manage posts and audience'
  },
  LinkedIn: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700',
    description: 'Connect your LinkedIn profile for professional content'
  }
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [isConnecting, setIsConnecting] = useState<string>('')

  // Fetch social connections
  const { data, error, mutate } = useSWR<{ connections: SocialConnection[] }>(
    '/api/social/connections',
    fetcher
  )

  useEffect(() => {
    if (data?.connections) {
      setConnections(data.connections)
    }
  }, [data])

  const handleConnect = async (platform: string) => {
    setIsConnecting(platform)
    
    try {
      // Initiate OAuth flow
      const response = await fetch(`/api/social/${platform.toLowerCase()}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.authUrl) {
        // Redirect to OAuth URL
        window.location.href = result.authUrl
      } else {
        throw new Error(result.error || 'Failed to initiate connection')
      }
    } catch (error) {
      console.error('Connection error:', error)
      alert('Failed to connect to ' + platform)
    } finally {
      setIsConnecting('')
    }
  }

  const handleDisconnect = async (connectionId: string, platform: string) => {
    if (!confirm(`Are you sure you want to disconnect from ${platform}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/social/connections/${connectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        mutate()
      } else {
        throw new Error('Failed to disconnect')
      }
    } catch (error) {
      console.error('Disconnection error:', error)
      alert('Failed to disconnect from ' + platform)
    }
  }

  const handleRefresh = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/social/connections/${connectionId}/refresh`, {
        method: 'POST'
      })

      if (response.ok) {
        mutate()
      } else {
        throw new Error('Failed to refresh connection')
      }
    } catch (error) {
      console.error('Refresh error:', error)
      alert('Failed to refresh connection')
    }
  }

  const getConnectionForPlatform = (platform: string) => {
    return connections.find(conn => conn.platform === platform)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading connections. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Social Media Connections</h1>
        <p className="text-gray-600">
          Connect your social media accounts to enable content publishing and analytics tracking
        </p>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(platformInfo).map(([platform, info]) => {
          const connection = getConnectionForPlatform(platform)
          return (
            <div key={platform} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{info.icon}</span>
                <span className={`w-3 h-3 rounded-full ${
                  connection?.isConnected 
                    ? connection.status === 'active' 
                      ? 'bg-green-400' 
                      : 'bg-yellow-400'
                    : 'bg-gray-300'
                }`}></span>
              </div>
              <h3 className="font-medium text-gray-900">{info.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {connection?.isConnected ? 'Connected' : 'Not Connected'}
              </p>
              {connection?.metrics && (
                <div className="text-xs text-gray-500 mt-2">
                  {connection.metrics.followers.toLocaleString()} followers
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Platform Connections */}
      <div className="space-y-6">
        {Object.entries(platformInfo).map(([platform, info]) => {
          const connection = getConnectionForPlatform(platform)
          
          return (
            <div key={platform} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${info.color} flex items-center justify-center text-white text-xl`}>
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{info.name}</h3>
                      <p className="text-sm text-gray-600">{info.description}</p>
                      {connection && (
                        <p className="text-sm text-gray-500 mt-1">
                          Connected as: <span className="font-medium">{connection.accountName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {connection?.isConnected ? (
                      <>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          connection.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : connection.status === 'expired'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {connection.status}
                        </span>
                        <button
                          onClick={() => handleRefresh(connection.id)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Refresh
                        </button>
                        <button
                          onClick={() => handleDisconnect(connection.id, platform)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform)}
                        disabled={isConnecting === platform}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${info.color} text-white hover:opacity-90 disabled:opacity-50`}
                      >
                        {isConnecting === platform ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Connection Details */}
                {connection && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Last Sync</h4>
                      <p className="text-sm text-gray-900">
                        {new Date(connection.lastSync).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
                      <div className="flex flex-wrap gap-1">
                        {connection.permissions.map(permission => (
                          <span
                            key={permission}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>

                    {connection.metrics && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Account Metrics</h4>
                        <div className="space-y-1 text-sm">
                          <div>Followers: {connection.metrics.followers.toLocaleString()}</div>
                          <div>Posts: {connection.metrics.posts.toLocaleString()}</div>
                          <div>Engagement: {connection.metrics.engagement.toFixed(1)}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Connection Issues */}
                {connection && connection.status !== 'active' && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-400">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">
                          {connection.status === 'expired' ? 'Connection Expired' : 'Connection Error'}
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          {connection.status === 'expired' 
                            ? 'Your access token has expired. Please refresh your connection.'
                            : 'There was an error with your connection. Please try refreshing or reconnecting.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Connection Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Connection Tips</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <p>Ensure you have the necessary permissions on your social media accounts before connecting</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <p>Connections may expire periodically and will need to be refreshed</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <p>Disconnecting an account will stop all scheduled posts for that platform</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <p>For LinkedIn, ensure you're connecting a business account with posting permissions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
