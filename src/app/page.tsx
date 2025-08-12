
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bingo Vibe</h1>
          <h2 className="text-xl text-gray-600">Marketing Command Center</h2>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/auth/signin" 
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors block text-center font-medium"
          >
            Sign In to Dashboard
          </Link>
          
          <div className="text-center text-sm text-gray-500">
            <p>Demo Credentials:</p>
            <p>Username: admin | Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
