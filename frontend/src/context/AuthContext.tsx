import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase'

interface User {
  id: string
  email: string
  displayName: string | null
  photoURL: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isFirebaseConfigured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  // Listen to auth state changes
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser))
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      console.warn('Firebase not configured - running in guest mode')
      alert('Sign-in requires Firebase configuration.\n\nAdd your Firebase config to .env to enable cloud sync.')
      return
    }

    try {
      await signInWithPopup(auth, googleProvider)
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    if (!auth) return
    
    try {
      await firebaseSignOut(auth)
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error('Sign-out error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isFirebaseConfigured, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
