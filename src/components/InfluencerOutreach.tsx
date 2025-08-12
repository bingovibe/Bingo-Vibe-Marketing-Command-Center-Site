'use client'

import { useState, useEffect } from 'react'
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
}

interface Campaign {
  id: string
  name: string
}

interface OutreachTemplate {
  id: string
  name: string
  subject: string
  message: string
  variables: string[]
  isDefault: boolean
}

interface Props {
  selectedInfluencers?: Influencer[]
  onClose?: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function InfluencerOutreach({ selectedInfluencers = [], onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history'>('compose')
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null)
  const [customSubject, setCustomSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [sendImmediately, setSendImmediately] = useState(true)
  const [sending, setSending] = useState(false)

  // Template form for creating new templates
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    message: '',
  })
  const [showTemplateForm, setShowTemplateForm] = useState(false)

  // Fetch templates
  const { data: templatesData, error: templatesError, mutate: mutateTemplates } = useSWR(
    '/api/influencers/templates',
    fetcher
  )

  // Fetch campaigns
  const { data: campaignsData } = useSWR('/api/campaigns', fetcher)

  // Fetch outreach history
  const { data: outreachData, mutate: mutateOutreach } = useSWR(
    '/api/influencers/outreach',
    fetcher
  )

  const templates = templatesData?.templates || []
  const campaigns = campaignsData?.campaigns || []
  const outreachHistory = outreachData?.outreachEmails || []

  // Load template into form
  const loadTemplate = (template: OutreachTemplate) => {
    setSelectedTemplate(template)
    setCustomSubject(template.subject)
    setCustomMessage(template.message)
  }

  // Send outreach emails
  const handleSendOutreach = async () => {
    if (!customSubject || !customMessage) {
      toast.error('Subject and message are required')
      return
    }

    if (selectedInfluencers.length === 0) {
      toast.error('No influencers selected')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/influencers/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          influencerIds: selectedInfluencers.map(inf => inf.id),
          campaignId: selectedCampaign || null,
          templateId: selectedTemplate?.id || null,
          subject: customSubject,
          message: customMessage,
          scheduledFor: scheduledFor || null,
          sendImmediately,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        mutateOutreach()
        onClose?.()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send outreach')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send outreach')
      console.error('Outreach error:', error)
    } finally {
      setSending(false)
    }
  }

  // Create new template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.message) {
      toast.error('All template fields are required')
      return
    }

    try {
      const response = await fetch('/api/influencers/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      })

      if (response.ok) {
        toast.success('Template created successfully')
        mutateTemplates()
        setNewTemplate({ name: '', subject: '', message: '' })
        setShowTemplateForm(false)
      } else {
        throw new Error('Failed to create template')
      }
    } catch (error) {
      toast.error('Failed to create template')
      console.error('Template creation error:', error)
    }
  }

  // Get variables in a template for display
  const getTemplateVariables = (template: OutreachTemplate) => {
    const variables = template.variables || []
    return variables.length > 0 ? variables.join(', ') : 'No variables'
  }

  const formatOutreachStatus = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-800' },
      OPENED: { label: 'Opened', color: 'bg-green-100 text-green-800' },
      REPLIED: { label: 'Replied', color: 'bg-green-100 text-green-800' },
      INTERESTED: { label: 'Interested', color: 'bg-purple-100 text-purple-800' },
      DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-800' },
      COLLABORATED: { label: 'Collaborated', color: 'bg-emerald-100 text-emerald-800' },
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Influencer Outreach</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
          )}
        </div>
        {selectedInfluencers.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {selectedInfluencers.length} influencer{selectedInfluencers.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {[
            { id: 'compose', label: 'Compose', icon: '✉️' },
            { id: 'templates', label: 'Templates', icon: '📝' },
            { id: 'history', label: 'History', icon: '📋' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="space-y-6">
            {/* Campaign Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign (Optional)
              </label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a campaign</option>
                {campaigns.map((campaign: Campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Template
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((template: OutreachTemplate) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className={`p-4 border rounded-lg text-left hover:bg-gray-50 ${
                      selectedTemplate?.id === template.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Variables: {getTemplateVariables(template)}
                    </div>
                    {template.isDefault && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Default
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter email subject..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {'{name}'}, {'{handle}'}, {'{platform}'}, {'{followers}'}, {'{campaign}'}
              </p>
            </div>

            {/* Email Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Compose your outreach message..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use variables like {'{name}'} and {'{handle}'} for personalization
              </p>
            </div>

            {/* Scheduling Options */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendImmediately}
                    onChange={(e) => setSendImmediately(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Send immediately</span>
                </label>
              </div>

              {!sendImmediately && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule for
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Selected Influencers Preview */}
            {selectedInfluencers.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Sending to {selectedInfluencers.length} influencer{selectedInfluencers.length !== 1 ? 's' : ''}:
                </h4>
                <div className="space-y-2">
                  {selectedInfluencers.slice(0, 5).map(influencer => (
                    <div key={influencer.id} className="flex items-center justify-between text-sm">
                      <span>{influencer.name} (@{influencer.handle})</span>
                      <span className="text-blue-600">{influencer.platform}</span>
                    </div>
                  ))}
                  {selectedInfluencers.length > 5 && (
                    <div className="text-sm text-blue-600">
                      +{selectedInfluencers.length - 5} more influencers
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendOutreach}
              disabled={sending || !customSubject || !customMessage || selectedInfluencers.length === 0}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending 
                ? 'Sending...' 
                : sendImmediately 
                  ? `Send to ${selectedInfluencers.length} Influencer${selectedInfluencers.length !== 1 ? 's' : ''}` 
                  : `Schedule for ${selectedInfluencers.length} Influencer${selectedInfluencers.length !== 1 ? 's' : ''}`
              }
            </button>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Email Templates</h4>
              <button
                onClick={() => setShowTemplateForm(!showTemplateForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showTemplateForm ? 'Cancel' : 'New Template'}
              </button>
            </div>

            {showTemplateForm && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h5 className="font-medium text-gray-900">Create New Template</h5>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Initial Collaboration Request"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Collaboration Opportunity with {name}"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={newTemplate.message}
                    onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hi {name},&#10;&#10;I hope this message finds you well..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Template
                  </button>
                  <button
                    onClick={() => setShowTemplateForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {templates.map((template: OutreachTemplate) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{template.name}</h5>
                    <div className="flex items-center space-x-2">
                      {template.isDefault && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Default
                        </span>
                      )}
                      <button
                        onClick={() => loadTemplate(template)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Subject:</strong> {template.subject}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Variables:</strong> {getTemplateVariables(template)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {template.message.substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Outreach History</h4>
            
            {outreachHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl text-gray-400 mb-4">📧</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Outreach History</h3>
                <p className="text-gray-500">Your outreach emails will appear here once sent.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outreachHistory.map((outreach: any) => {
                  const statusConfig = formatOutreachStatus(outreach.status)
                  return (
                    <div key={outreach.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">
                            {outreach.influencer.name}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(outreach.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Subject:</strong> {outreach.subject}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Platform:</strong> {outreach.influencer.platform} • 
                        <strong> Handle:</strong> @{outreach.influencer.handle} • 
                        <strong> Followers:</strong> {(outreach.influencer.followerCount || 0).toLocaleString()}
                      </div>
                      {outreach.campaign && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Campaign:</strong> {outreach.campaign.name}
                        </div>
                      )}
                      {outreach.sentAt && (
                        <div className="text-xs text-gray-500">
                          Sent: {new Date(outreach.sentAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
