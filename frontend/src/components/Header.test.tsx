import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'
import type { Settings } from '../hooks/useSettings'

// Default mock - no user signed in
const mockSignInWithGoogle = vi.fn()
const mockSignOut = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    isFirebaseConfigured: true,
    signInWithGoogle: mockSignInWithGoogle,
    signOut: mockSignOut,
  }),
}))

const defaultSettings: Settings = {
  work_duration_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  long_break_interval: 4,
  auto_start_breaks: false,
  dark_mode: false,
  sound_enabled: true,
  notifications_enabled: true,
  daily_pomodoro_goal: 8,
  daily_goal_enabled: true,
  flow_mode_enabled: false,
  move_completed_to_bottom: false,
  dated_tasks_first: false,
  exclude_weekends_from_streak: false,
  show_completed_projects: false,
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders app title', () => {
    render(<Header settings={defaultSettings} onUpdateSettings={vi.fn()} />)

    // Check for heading containing app name (don't hardcode exact emoji placement)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('pomo pal')
  })

  it('shows sign-in button when user is not authenticated', () => {
    render(<Header settings={defaultSettings} onUpdateSettings={vi.fn()} />)

    expect(screen.getByTitle('Sign in with Google to sync across devices')).toBeInTheDocument()
  })

  it('calls signInWithGoogle when sign-in button is clicked', () => {
    render(<Header settings={defaultSettings} onUpdateSettings={vi.fn()} />)

    fireEvent.click(screen.getByTitle('Sign in with Google to sync across devices'))

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('toggles dark mode when button is clicked', () => {
    const onUpdateSettings = vi.fn()
    render(<Header settings={defaultSettings} onUpdateSettings={onUpdateSettings} />)

    fireEvent.click(screen.getByTitle('Toggle dark mode'))

    expect(onUpdateSettings).toHaveBeenCalledWith({ dark_mode: true })
  })

  it('shows moon emoji when dark mode is off', () => {
    render(<Header settings={defaultSettings} onUpdateSettings={vi.fn()} />)

    expect(screen.getByTitle('Toggle dark mode')).toHaveTextContent('🌙')
  })

  it('shows sun emoji when dark mode is on', () => {
    const darkSettings = { ...defaultSettings, dark_mode: true }
    render(<Header settings={darkSettings} onUpdateSettings={vi.fn()} />)

    expect(screen.getByTitle('Toggle dark mode')).toHaveTextContent('☀️')
  })

  it('opens settings modal when settings button is clicked', () => {
    render(<Header settings={defaultSettings} onUpdateSettings={vi.fn()} />)

    fireEvent.click(screen.getByTitle('Settings'))

    // Settings modal should appear (has "Settings" heading and "Timer" section)
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('opens help modal when help button is clicked', () => {
    render(<Header settings={defaultSettings} onUpdateSettings={vi.fn()} />)

    fireEvent.click(screen.getByTitle('Help & Guide'))

    // Help modal should appear (has "How to Use" in heading)
    expect(screen.getByRole('heading', { name: /How to Use/i })).toBeInTheDocument()
  })
})

describe('Header with authenticated user', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Override mock for authenticated user
    vi.doMock('../context/AuthContext', () => ({
      useAuth: () => ({
        user: {
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'https://example.com/photo.jpg',
        },
        isLoading: false,
        isFirebaseConfigured: true,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: mockSignOut,
      }),
    }))
  })

  it('shows user menu when user is authenticated', async () => {
    // Need to re-import with new mock
    vi.resetModules()
    vi.doMock('../context/AuthContext', () => ({
      useAuth: () => ({
        user: {
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: null,
        },
        isLoading: false,
        isFirebaseConfigured: true,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: mockSignOut,
      }),
    }))
    
    const { default: HeaderComponent } = await import('./Header')
    render(<HeaderComponent settings={defaultSettings} onUpdateSettings={vi.fn()} />)

    // Should show user name (on desktop) or user icon
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('shows dropdown menu when user button is clicked', async () => {
    vi.resetModules()
    vi.doMock('../context/AuthContext', () => ({
      useAuth: () => ({
        user: {
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: null,
        },
        isLoading: false,
        isFirebaseConfigured: true,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: mockSignOut,
      }),
    }))
    
    const { default: HeaderComponent } = await import('./Header')
    render(<HeaderComponent settings={defaultSettings} onUpdateSettings={vi.fn()} />)

    // Click user button to open dropdown
    fireEvent.click(screen.getByText('Test User'))

    // Dropdown should show email and sign out button
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('calls signOut when sign out button is clicked', async () => {
    vi.resetModules()
    const localSignOut = vi.fn()
    vi.doMock('../context/AuthContext', () => ({
      useAuth: () => ({
        user: {
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: null,
        },
        isLoading: false,
        isFirebaseConfigured: true,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: localSignOut,
      }),
    }))
    
    const { default: HeaderComponent } = await import('./Header')
    render(<HeaderComponent settings={defaultSettings} onUpdateSettings={vi.fn()} />)

    // Open dropdown
    fireEvent.click(screen.getByText('Test User'))
    
    // Click sign out
    fireEvent.click(screen.getByText('Sign out'))

    expect(localSignOut).toHaveBeenCalledTimes(1)
  })
})
