import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  auth: null,
  googleProvider: null,
  isFirebaseConfigured: false,
}))

// Test component to access auth context
function TestComponent() {
  const { user, isLoading, isFirebaseConfigured, signInWithGoogle, signOut } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="configured">{isFirebaseConfigured ? 'yes' : 'no'}</div>
      <button onClick={signInWithGoogle}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides auth context to children', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('shows Firebase not configured when no config', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('configured')).toHaveTextContent('no')
  })

  it('throws error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within AuthProvider')
    
    spy.mockRestore()
  })

  it('starts in not-loading state when Firebase is not configured', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should immediately be ready since Firebase isn't configured
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })
  })
})

describe('AuthContext with Firebase configured', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('shows alert when signing in without Firebase config', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    screen.getByText('Sign In').click()
    
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('Sign-in requires Firebase configuration')
    )
    
    alertSpy.mockRestore()
  })
})
