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
        className="flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-150 hover:bg-[var(--color-bg-tertiary)]"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ background: 'var(--color-accent)', color: 'white' }}
          >
            {(user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
        )}
        <svg 
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-text-secondary)' }}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
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

// Icon button component
function IconButton({ 
  onClick, 
  title, 
  children 
}: { 
  onClick: () => void
  title: string
  children: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 hover:bg-[var(--color-bg-tertiary)]"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {children}
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
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
          style={{ background: 'var(--color-accent)' }}
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
      <div className="flex items-center gap-1">
        {/* Dark mode toggle */}
        <IconButton
          onClick={() => onUpdateSettings({ dark_mode: !settings.dark_mode })}
          title={settings.dark_mode ? 'Light mode' : 'Dark mode'}
        >
          {settings.dark_mode ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </IconButton>

        {/* Help */}
        <IconButton onClick={() => setShowHelp(true)} title="Help">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </IconButton>

        {/* Settings */}
        <IconButton onClick={() => setShowSettings(true)} title="Settings">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </IconButton>

        {/* Divider */}
        <div 
          className="w-px h-6 mx-2" 
          style={{ background: 'var(--color-bg-tertiary)' }}
        />

        {/* Sign in / User menu */}
        {user ? (
          <UserMenu user={user} onSignOut={signOut} />
        ) : (
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-text-primary)' }}
            title="Sign in to sync across devices"
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
