
import InfluencerOutreach from '@/components/InfluencerOutreach'
import InfluencerList from '@/components/InfluencerList'

export default function InfluencersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Influencer Outreach</h1>
        <p className="text-gray-600 mt-1">Manage influencer relationships and outreach campaigns</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <InfluencerOutreach />
        </div>
        <div className="xl:col-span-2">
          <InfluencerList />
        </div>
      </div>
    </div>
  )
}
