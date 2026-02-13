import { useState } from 'react'
import type { Settings } from '../hooks/useSettings'
import SettingsModal from './SettingsModal'
import { useAuth } from '../context/AuthContext'

interface HeaderProps {
  settings: Settings
  onUpdateSettings: (updates: Partial<Settings>) => void
}

export default function Header({ settings, onUpdateSettings }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const { user, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🍅</span>
        <h1 className="text-2xl font-bold text-white dark:text-gray-100">Pomodoro</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Sign in / User menu */}
        {user ? (
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-sm"
            title="Sign out"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <span>👤</span>
            )}
            <span className="hidden sm:inline">{user.displayName || 'User'}</span>
          </button>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-sm"
            title="Sign in with Google to sync across devices"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={() => onUpdateSettings({ dark_mode: !settings.dark_mode })}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          title="Toggle dark mode"
        >
          {settings.dark_mode ? '☀️' : '🌙'}
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={onUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </header>
  )
}
