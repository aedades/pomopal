import { useState, useRef, useEffect } from 'react'
import type { Settings } from '../hooks/useSettings'
import SettingsModal from './SettingsModal'
import HelpModal from './HelpModal'
import { useAuth } from '../context/AuthContext'

// User dropdown menu component
function UserMenu({ user, onSignOut }: { user: { displayName: string | null; photoURL: string | null; email: string }; onSignOut: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 hover:opacity-80 overflow-hidden"
        style={{ background: 'rgba(255, 255, 255, 0.25)' }}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg">
            {(user.displayName || user.email || 'U')[0].toUpperCase()}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 rounded-xl py-1 z-50 glass-elevated"
          style={{ 
            border: '1px solid var(--color-bg-tertiary)',
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-bg-tertiary)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {user.displayName || 'User'}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false)
              onSignOut()
            }}
            className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-accent)' }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

// Icon button component with colored background
function IconButton({ 
  onClick, 
  title, 
  children,
  emoji
}: { 
  onClick: () => void
  title: string
  children?: React.ReactNode
  emoji?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 hover:opacity-80 text-lg"
      style={{ 
        background: 'rgba(255, 255, 255, 0.25)',
      }}
    >
      {emoji || children}
    </button>
  )
}

interface HeaderProps {
  settings: Settings
  onUpdateSettings: (updates: Partial<Settings>) => void
}

export default function Header({ settings, onUpdateSettings }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { user, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="flex items-center justify-between mb-8 animate-fade-in-up">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'rgba(255, 255, 255, 0.25)' }}
        >
          🍅
        </div>
        <h1 
          className="text-xl font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Pomodoro
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <IconButton
          onClick={() => onUpdateSettings({ dark_mode: !settings.dark_mode })}
          title={settings.dark_mode ? 'Light mode' : 'Dark mode'}
          emoji={settings.dark_mode ? '☀️' : '🌙'}
        />

        {/* Help */}
        <IconButton onClick={() => setShowHelp(true)} title="Help" emoji="❓" />

        {/* Settings */}
        <IconButton onClick={() => setShowSettings(true)} title="Settings" emoji="⚙️" />

        {/* Sign in / User menu */}
        {user ? (
          <UserMenu user={user} onSignOut={signOut} />
        ) : (
          <button
            onClick={signInWithGoogle}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-150 hover:opacity-80"
            style={{ background: 'rgba(255, 255, 255, 0.25)' }}
            title="Sign in to sync across devices"
          >
            👤
          </button>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={onUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}
    </header>
  )
}
