
'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Character {
  id: string
  name: string
  slug: string
  description: string
  personality: string
  targetDemo: string
  voiceStyle: string
}

export default function ContentCreator() {
  const { data: session } = useSession()
  const [platform, setPlatform] = useState('TIKTOK')
  const [contentType, setContentType] = useState('VIDEO')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState('')
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const platforms = [
    { id: 'TIKTOK', name: 'TikTok', icon: '📱' },
    { id: 'INSTAGRAM', name: 'Instagram', icon: '📷' },
    { id: 'YOUTUBE', name: 'YouTube', icon: '📺' },
    { id: 'FACEBOOK', name: 'Facebook', icon: '👥' }
  ]

  const contentTypes = [
    { id: 'VIDEO', name: 'Video' },
    { id: 'IMAGE', name: 'Image' },
    { id: 'TEXT', name: 'Text' },
    { id: 'STORY', name: 'Story' },
    { id: 'REEL', name: 'Reel' }
  ]

  // Load characters on mount
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const response = await fetch('/api/characters')
        if (response.ok) {
          const data = await response.json()
          setCharacters(data)
          if (data.length > 0) {
            setSelectedCharacter(data[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading characters:', error)
      }
    }

    loadCharacters()
  }, [])

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

  const handleGenerateWithAI = async () => {
    if (!selectedCharacter) {
      setError('Please select a character first')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: selectedCharacter,
          platform,
          contentType,
          prompt: title || `Generate ${contentType.toLowerCase()} content for ${platform}`,
          includeTrending: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTitle(data.title)
        setContent(data.content)
        setSuccess('Content generated successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to generate content')
      }
    } catch (error) {
      console.error('Error generating content:', error)
      setError('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!title || !content) {
      setError('Please enter a title and content')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          platform,
          contentType,
          characterId: selectedCharacter || null
        })
      })

      if (response.ok) {
        setSuccess('Draft saved successfully!')
        // Clear form
        setTitle('')
        setContent('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save draft')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      setError('Failed to save draft. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!title || !content) {
      setError('Please enter a title and content')
      return
    }

    setLoading(true)
    setError('')

    try {
      // First save as draft
      const draftResponse = await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          platform,
          contentType,
          characterId: selectedCharacter || null
        })
      })

      if (draftResponse.ok) {
        const draft = await draftResponse.json()
        
        // Update draft status to review
        const updateResponse = await fetch(`/api/drafts/${draft.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'REVIEW'
          })
        })

        if (updateResponse.ok) {
          setSuccess('Content submitted for review!')
          // Clear form
          setTitle('')
          setContent('')
        } else {
          setError('Failed to submit for review')
        }
      } else {
        const errorData = await draftResponse.json()
        setError(errorData.error || 'Failed to save draft')
      }
    } catch (error) {
      console.error('Error submitting for review:', error)
      setError('Failed to submit for review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Content</h3>
        <p className="text-gray-600">Please sign in to create content.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Create Content</h3>
      
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
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Brand Character</label>
          <select
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select a character...</option>
            {characters.map((char) => (
              <option key={char.id} value={char.id}>{char.name}</option>
            ))}
          </select>
          {selectedCharacter && (
            <p className="mt-1 text-xs text-gray-600">
              {characters.find((c) => c.id === selectedCharacter)?.description}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
          <div className="grid grid-cols-4 gap-2">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex items-center justify-center p-3 rounded-lg border text-sm ${
                  platform === p.id
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="mr-1">{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {contentTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter content title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Create your content here..."
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleGenerateWithAI}
            disabled={isGenerating || !selectedCharacter}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              'Generate with AI'
            )}
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={loading || !title || !content}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmitForReview}
            disabled={loading || !title || !content}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
