import { useState, useEffect, useCallback } from 'react'

export interface Settings {
  daily_pomodoro_goal: number
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
}

const DEFAULT_SETTINGS: Settings = {
  daily_pomodoro_goal: 8,
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
}

const STORAGE_KEY = 'pomodoro:settings'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
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

  // Persist to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }, [settings])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  return { settings, updateSettings }
}
