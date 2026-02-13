import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getMessaging, Messaging } from 'firebase/messaging'

// Firebase config - get from Firebase Console → Project Settings → Your apps
// These are safe to expose in client-side code (security comes from Firestore rules)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pomopal.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pomopal',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pomopal.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Check if Firebase is configured (has API key)
export const isFirebaseConfigured = !!firebaseConfig.apiKey

// Initialize Firebase only if configured
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let googleProvider: GoogleAuthProvider | null = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    googleProvider = new GoogleAuthProvider()
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
}

// Get messaging instance (only works in browser with service worker)
export function getMessagingInstance(): Messaging | null {
  if (!app || !isFirebaseConfigured) return null
  if (typeof window === 'undefined') return null
  
  try {
    return getMessaging(app)
  } catch (error) {
    console.error('Firebase messaging error:', error)
    return null
  }
}

export { app, auth, db, googleProvider }
export default app
