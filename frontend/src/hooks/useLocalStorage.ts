import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for persisting state to localStorage.
 * Used for guest mode - tasks/projects/settings persist locally.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get initial value from localStorage or use default
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  // Persist to localStorage whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e)
    }
  }, [key, value])

  return [value, setValue] as const
}

/**
 * Hook for guest mode data management.
 * Stores tasks, projects, and pomodoro history in localStorage.
 */
// UUID fallback for older Safari (crypto.randomUUID not available in Safari < 15.4)
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function useGuestData() {
  const [tasks, setTasks] = useLocalStorage<GuestTask[]>('pomodoro:guest:tasks', [])
  const [projects, setProjects] = useLocalStorage<GuestProject[]>('pomodoro:guest:projects', [])
  const [pomodoros, setPomodoros] = useLocalStorage<GuestPomodoro[]>('pomodoro:guest:pomodoros', [])
  const [todayCount, setTodayCount] = useLocalStorage<{ date: string; count: number }>(
    'pomodoro:guest:today',
    { date: new Date().toISOString().split('T')[0], count: 0 }
  )

  // Reset today count if it's a new day
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    if (todayCount.date !== today) {
      setTodayCount({ date: today, count: 0 })
    }
  }, [todayCount.date, setTodayCount])

  const addTask = useCallback((title: string, projectId?: string, estimatedPomodoros = 1, dueDate?: string) => {
    const newTask: GuestTask = {
      id: generateId(),
      title,
      projectId,
      completed: false,
      estimatedPomodoros,
      actualPomodoros: 0,
      createdAt: new Date().toISOString(),
      dueDate,
    }
    setTasks(prev => [newTask, ...prev])
    return newTask
  }, [setTasks])

  const updateTask = useCallback((id: string, updates: Partial<GuestTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [setTasks])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [setTasks])

  const addProject = useCallback((name: string, color = '#6366f1') => {
    const newProject: GuestProject = {
      id: generateId(),
      name,
      color,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setProjects(prev => [newProject, ...prev])
    return newProject
  }, [setProjects])

  const updateProject = useCallback((id: string, updates: Partial<GuestProject>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    // If completing project, complete all its tasks
    if (updates.completed) {
      setTasks(prev => prev.map(t => 
        t.projectId === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      ))
    }
  }, [setProjects, setTasks])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    // Unlink tasks from deleted project
    setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: undefined } : t))
  }, [setProjects, setTasks])

  const recordPomodoro = useCallback((taskId?: string, interrupted = false) => {
    const newPomodoro: GuestPomodoro = {
      id: generateId(),
      taskId,
      durationMinutes: 25,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      interrupted,
    }
    setPomodoros(prev => [newPomodoro, ...prev.slice(0, 999)]) // Keep last 1000

    if (!interrupted) {
      // Increment today's count
      const today = new Date().toISOString().split('T')[0]
      setTodayCount(prev => ({
        date: today,
        count: prev.date === today ? prev.count + 1 : 1,
      }))

      // Increment task's actual pomodoros
      if (taskId) {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, actualPomodoros: t.actualPomodoros + 1 } : t
        ))
      }
    }
  }, [setPomodoros, setTodayCount, setTasks])

  const getTodayPomodoros = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return todayCount.date === today ? todayCount.count : 0
  }, [todayCount])

  // Reorder undated tasks by updating their sortOrder
  const reorderTasks = useCallback((taskIds: string[]) => {
    setTasks(prev => {
      const updated = [...prev]
      taskIds.forEach((id, index) => {
        const taskIndex = updated.findIndex(t => t.id === id)
        if (taskIndex !== -1) {
          updated[taskIndex] = { ...updated[taskIndex], sortOrder: index }
        }
      })
      return updated
    })
  }, [setTasks])

  return {
    tasks,
    projects,
    pomodoros,
    todayPomodoros: getTodayPomodoros(),
    addTask,
    updateTask,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    recordPomodoro,
    reorderTasks,
  }
}

// Types for guest mode data
export interface GuestTask {
  id: string
  title: string
  projectId?: string
  completed: boolean
  completedAt?: string
  estimatedPomodoros: number
  actualPomodoros: number
  createdAt: string
  dueDate?: string // ISO date string (optional)
  sortOrder?: number // For manual ordering of undated tasks
}

export interface GuestProject {
  id: string
  name: string
  color: string
  completed: boolean
  completedAt?: string
  createdAt: string
  dueDate?: string // ISO date string (optional)
}

export interface GuestPomodoro {
  id: string
  taskId?: string
  durationMinutes: number
  startedAt: string
  completedAt: string
  interrupted: boolean
}
