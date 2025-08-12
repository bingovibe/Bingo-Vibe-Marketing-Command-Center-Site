
import ContentCreator from '@/components/ContentCreator'
import CharacterSelector from '@/components/CharacterSelector'

export default function ContentHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Creation Hub</h1>
        <p className="text-gray-600 mt-1">Create platform-specific content with brand characters</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CharacterSelector />
        </div>
        <div className="lg:col-span-2">
          <ContentCreator />
        </div>
      </div>
    </div>
  )
}
