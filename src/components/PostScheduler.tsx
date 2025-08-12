
'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Draft {
  id: string
  title: string
  content: string
  platform: string
  contentType: string
  character?: {
    name: string
    slug: string
  }
  campaign?: {
    name: string
  }
  status: string
}

interface ScheduledPost {
  id: string
  title: string
  content: string
  platform: string
  contentType: string
  scheduledAt: string
  status: string
  character?: {
    name: string
    slug: string
  }
  campaign?: {
    name: string
  }
}

export default function PostScheduler() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedDraft, setSelectedDraft] = useState('')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'schedule' | 'scheduled'>('schedule')

  // Load drafts and scheduled posts on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadDrafts(), loadScheduledPosts()])
    }
    
    if (session) {
      loadData()
    }
  }, [session])

  // Clear messages after timeout
  useEffect(() => {
    if (error || success) {
      const timeout = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [error, success])

  const loadDrafts = async () => {
    try {
      const response = await fetch('/api/drafts')
      if (response.ok) {
        const data = await response.json()
        // Filter for approved drafts or drafts ready for scheduling
        const readyDrafts = data.filter((draft: Draft) => 
          draft.status === 'APPROVED' || draft.status === 'DRAFT'
        )
        setDrafts(readyDrafts)
        if (readyDrafts.length > 0 && !selectedDraft) {
          setSelectedDraft(readyDrafts[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
    }
  }

  const loadScheduledPosts = async () => {
    try {
      const response = await fetch('/api/posts?status=SCHEDULED')
      if (response.ok) {
        const data = await response.json()
        setScheduledPosts(data)
      }
    } catch (error) {
      console.error('Error loading scheduled posts:', error)
    }
  }

  const handleSchedulePost = async () => {
    if (!selectedDraft || !selectedDate || !selectedTime) {
      setError('Please select a draft, date, and time')
      return
    }

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}`)
    
    // Check if scheduled time is in the future
    if (scheduledAt <= new Date()) {
      setError('Scheduled time must be in the future')
      return
    }

    setLoading(true)
    setError('')

    try {
      const draft = drafts.find(d => d.id === selectedDraft)
      if (!draft) {
        setError('Selected draft not found')
        return
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          platform: draft.platform,
          contentType: draft.contentType,
          characterId: draft.character?.slug ? null : null, // Will need to map character properly
          campaignId: draft.campaign ? null : null, // Will need campaign ID
          scheduledAt: scheduledAt.toISOString(),
          draftId: draft.id
        })
      })

      if (response.ok) {
        setSuccess('Post scheduled successfully!')
        setSelectedDate('')
        setSelectedTime('')
        setSelectedDraft(drafts[0]?.id || '')
        await loadDrafts() // Refresh drafts
        await loadScheduledPosts() // Refresh scheduled posts
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to schedule post')
      }
    } catch (error) {
      console.error('Error scheduling post:', error)
      setError('Failed to schedule post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePublishNow = async (postId: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/scheduler/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSuccess('Post published successfully!')
          await loadScheduledPosts() // Refresh the list
        } else {
          setError(data.error || 'Failed to publish post')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to publish post')
      }
    } catch (error) {
      console.error('Error publishing post:', error)
      setError('Failed to publish post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelScheduled = async (postId: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED'
        })
      })

      if (response.ok) {
        setSuccess('Scheduled post cancelled')
        await loadScheduledPosts() // Refresh the list
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to cancel post')
      }
    } catch (error) {
      console.error('Error cancelling post:', error)
      setError('Failed to cancel post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getOptimalTimes = (platform: string) => {
    const times = {
      'TIKTOK': ['09:00', '18:00', '19:00'],
      'INSTAGRAM': ['11:00', '14:00', '17:00'],
      'FACEBOOK': ['13:00', '15:00', '16:00'],
      'YOUTUBE': ['14:00', '20:00', '21:00']
    }
    return times[platform as keyof typeof times] || times.INSTAGRAM
  }

  const selectedDraftData = drafts.find(d => d.id === selectedDraft)

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Post</h3>
        <p className="text-gray-600">Please sign in to schedule posts.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Post Scheduler</h3>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              activeTab === 'schedule'
                ? 'bg-white text-purple-700 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Schedule New
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              activeTab === 'scheduled'
                ? 'bg-white text-purple-700 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Scheduled ({scheduledPosts.length})
          </button>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No approved drafts available for scheduling.</p>
              <p className="text-sm mt-1">Create and approve content first.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Draft</label>
                <select
                  value={selectedDraft}
                  onChange={(e) => setSelectedDraft(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {drafts.map((draft) => (
                    <option key={draft.id} value={draft.id}>
                      {draft.title} ({draft.platform}) - {draft.character?.name || 'No Character'}
                    </option>
                  ))}
                </select>
                {selectedDraftData && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Platform:</strong> {selectedDraftData.platform} • 
                      <strong> Type:</strong> {selectedDraftData.contentType}
                    </p>
                    <p className="text-sm text-gray-800">{selectedDraftData.content.substring(0, 100)}...</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {selectedDraftData && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Optimal Times for {selectedDraftData.platform}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {getOptimalTimes(selectedDraftData.platform).map((time, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTime(time)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSchedulePost}
                disabled={loading || !selectedDraft || !selectedDate || !selectedTime}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Scheduling...' : 'Schedule Post'}
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          {scheduledPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No posts scheduled yet.</p>
              <p className="text-sm mt-1">Schedule your first post using the "Schedule New" tab.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledPosts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{post.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {post.content.substring(0, 80)}...
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>📱 {post.platform}</span>
                        <span>📅 {new Date(post.scheduledAt).toLocaleDateString()}</span>
                        <span>🕐 {new Date(post.scheduledAt).toLocaleTimeString()}</span>
                        {post.character && <span>👤 {post.character.name}</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handlePublishNow(post.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                      >
                        Publish Now
                      </button>
                      <button
                        onClick={() => handleCancelScheduled(post.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
