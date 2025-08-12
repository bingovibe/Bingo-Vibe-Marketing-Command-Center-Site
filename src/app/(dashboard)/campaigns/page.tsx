
import CampaignList from '@/components/CampaignList'
import CampaignMetrics from '@/components/CampaignMetrics'

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Tracker</h1>
          <p className="text-gray-600 mt-1">Track performance and manage campaigns</p>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
          New Campaign
        </button>
      </div>
      
      <CampaignMetrics />
      <CampaignList />
    </div>
  )
}
