
export default function ScheduledPosts() {
  const posts = [
    {
      id: 1,
      title: 'Bingo Vibe Family Fun Night',
      character: 'Caven',
      platform: 'Facebook',
      scheduledFor: '2025-08-13 18:00',
      status: 'scheduled'
    },
    {
      id: 2,
      title: 'Gaming meets Bingo! 🎮',
      character: 'Zara',
      platform: 'TikTok',
      scheduledFor: '2025-08-13 19:00',
      status: 'scheduled'
    },
    {
      id: 3,
      title: 'Team Building with Bingo',
      character: 'Coach Martinez',
      platform: 'LinkedIn',
      scheduledFor: '2025-08-14 14:00',
      status: 'scheduled'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Scheduled Posts</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{post.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {post.character} • {post.platform}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Scheduled for: {new Date(post.scheduledFor).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                  <button className="text-sm text-red-600 hover:text-red-800">Cancel</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
