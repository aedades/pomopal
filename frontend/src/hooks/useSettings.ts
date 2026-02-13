import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

export interface Settings {
  daily_pomodoro_goal: number
  daily_goal_enabled: boolean // Whether to show goal progress
  auto_start_breaks: boolean
  dark_mode: boolean
  sound_enabled: boolean
  notifications_enabled: boolean
  work_duration_minutes: number
  short_break_minutes: number
  long_break_minutes: number
  long_break_interval: number
  flow_mode_enabled: boolean // Count up instead of down, no alerts
  move_completed_to_bottom: boolean // Auto-move completed tasks to bottom
  dated_tasks_first: boolean // Show tasks with due dates before undated tasks
  exclude_weekends_from_streak: boolean // Don't break streak for missing Sat/Sun
  show_completed_projects: boolean // Show completed projects in Manage Projects modal
}

const DEFAULT_SETTINGS: Settings = {
  daily_pomodoro_goal: 8,
  daily_goal_enabled: true,
  auto_start_breaks: false,
  dark_mode: false,
  sound_enabled: true,
  notifications_enabled: true,
  work_duration_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  long_break_interval: 4,
  flow_mode_enabled: false,
  move_completed_to_bottom: true,
  dated_tasks_first: true,
  exclude_weekends_from_streak: false,
  show_completed_projects: false,
}

const STORAGE_KEY = 'pomodoro:settings'

/**
 * Settings hook with Firestore sync when logged in.
 * - Logged in: syncs to Firestore, real-time updates across devices
 * - Logged out: localStorage only
 */
export function useSettings(userId?: string | null) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Always start with localStorage (fast initial load)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
    return DEFAULT_SETTINGS
  })
  
  const [isLoading, setIsLoading] = useState(!!userId)

  // Sync with Firestore when logged in
  useEffect(() => {
    if (!userId || !db || !isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
    
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const firestoreSettings = snapshot.data() as Settings
        setSettings({ ...DEFAULT_SETTINGS, ...firestoreSettings })
      }
      // If no Firestore settings exist yet, keep localStorage settings
      // They'll be saved to Firestore on next update
      setIsLoading(false)
    }, (error) => {
      console.error('Settings listener error:', error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  // Persist to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }, [settings])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates }
      
      // If logged in, also save to Firestore
      if (userId && db && isFirebaseConfigured) {
        const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
        setDoc(settingsRef, newSettings).catch(error => {
          console.error('Failed to save settings to Firestore:', error)
        })
      }
      
      return newSettings
    })
  }, [userId])

  return { settings, updateSettings, isLoading }
}
