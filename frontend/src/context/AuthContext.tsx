import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  id: string
  email: string
  displayName: string | null
  photoURL: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading] = useState(false)  // Will be used when Firebase Auth is implemented

  const signInWithGoogle = async () => {
    // TODO: Implement with Firebase Auth
    // import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
    // const auth = getAuth()
    // const provider = new GoogleAuthProvider()
    // const result = await signInWithPopup(auth, provider)
    // setUser({ id: result.user.uid, email: result.user.email, ... })
    
    alert('Google Sign-In coming soon! 🚧\n\nThis will enable:\n• Sync across devices\n• Cloud backup\n• Access from anywhere')
  }

  const signOut = async () => {
    // TODO: Implement with Firebase Auth
    // const auth = getAuth()
    // await auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
