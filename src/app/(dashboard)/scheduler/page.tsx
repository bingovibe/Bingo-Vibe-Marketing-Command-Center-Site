
import PostScheduler from '@/components/PostScheduler'
import ScheduledPosts from '@/components/ScheduledPosts'

export default function SchedulerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social Media Scheduler</h1>
        <p className="text-gray-600 mt-1">Schedule and manage your social media posts</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <PostScheduler />
        </div>
        <div className="xl:col-span-2">
          <ScheduledPosts />
        </div>
      </div>
    </div>
  )
}
