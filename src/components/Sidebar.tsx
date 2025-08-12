
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Content Hub', href: '/content-hub', icon: '✍️' },
  { name: 'Scheduler', href: '/scheduler', icon: '📅' },
  { name: 'Campaigns', href: '/campaigns', icon: '🚀' },
  { name: 'Influencers', href: '/influencers', icon: '👥' },
  { name: 'Calendar', href: '/calendar', icon: '📆' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
  { name: 'Approval', href: '/approval', icon: '✅' },
]

const settingsNavigation = [
  { name: 'Connections', href: '/settings/connections', icon: '🔗' },
  { name: 'Preferences', href: '/settings/preferences', icon: '⚙️' },
  { name: 'Notifications', href: '/settings/notifications', icon: '🔔' },
  { name: 'API Keys', href: '/settings/api-keys', icon: '🔑' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [showSettings, setShowSettings] = useState(false)

  const isActiveLink = (href: string) => {
    if (!pathname) return false
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold">Bingo Vibe MCC</h2>
        <p className="text-sm text-gray-400">Marketing Command Center</p>
      </div>
      
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm rounded-lg hover:bg-gray-700 transition-colors ${
                  isActiveLink(item.href) ? 'bg-purple-700 text-white' : 'text-gray-300'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
          
          {/* Settings Section */}
          <li className="pt-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg hover:bg-gray-700 transition-colors ${
                pathname?.startsWith('/settings') ? 'bg-purple-700 text-white' : 'text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-3">⚙️</span>
                Settings
              </div>
              <span className={`transition-transform ${showSettings ? 'rotate-90' : ''}`}>
                ➤
              </span>
            </button>
            
            {/* Settings Submenu */}
            {showSettings && (
              <ul className="mt-2 ml-4 space-y-1">
                {settingsNavigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-2 text-sm rounded-lg hover:bg-gray-700 transition-colors ${
                        pathname === item.href ? 'bg-purple-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      <span className="mr-3 text-xs">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Export Tools */}
          <li className="pt-4">
            <Link
              href="/export"
              className={`flex items-center px-4 py-2 text-sm rounded-lg hover:bg-gray-700 transition-colors ${
                pathname === '/export' ? 'bg-purple-700 text-white' : 'text-gray-300'
              }`}
            >
              <span className="mr-3">📊</span>
              Export Tools
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        {/* User Info */}
        <div className="mb-3 px-4 py-2 bg-gray-800 rounded-lg">
          <div className="text-sm font-medium text-white">Admin User</div>
          <div className="text-xs text-gray-400">admin@bingovibe.info</div>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <span className="mr-3">🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  )
}
