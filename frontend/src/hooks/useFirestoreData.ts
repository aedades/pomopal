import { useState, useEffect, useCallback } from 'react'
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { GuestTask, GuestProject, GuestPomodoro } from './useLocalStorage'

/**
 * Firestore data hook - syncs data in real-time across devices.
 * Data structure: /users/{userId}/tasks, /users/{userId}/projects, /users/{userId}/pomodoros
 */
export function useFirestoreData(userId: string | null) {
  const [tasks, setTasks] = useState<GuestTask[]>([])
  const [projects, setProjects] = useState<GuestProject[]>([])
  const [pomodoros, setPomodoros] = useState<GuestPomodoro[]>([])
  const [todayPomodoros, setTodayPomodoros] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Real-time listeners
  useEffect(() => {
    if (!userId || !db || !isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Subscribe to tasks
    const tasksRef = collection(db, 'users', userId, 'tasks')
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as GuestTask[]
      setTasks(data)
    }, (error) => {
      console.error('Tasks listener error:', error)
    })

    // Subscribe to projects
    const projectsRef = collection(db, 'users', userId, 'projects')
    const unsubProjects = onSnapshot(projectsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as GuestProject[]
      setProjects(data)
    }, (error) => {
      console.error('Projects listener error:', error)
    })

    // Subscribe to pomodoros from the last year (for stats)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const oneYearAgoISO = oneYearAgo.toISOString()
    
    const pomodorosRef = collection(db, 'users', userId, 'pomodoros')
    const pomodorosQuery = query(
      pomodorosRef,
      where('completedAt', '>=', oneYearAgoISO),
      orderBy('completedAt', 'desc')
    )
    const unsubPomodoros = onSnapshot(pomodorosQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as GuestPomodoro[]
      setPomodoros(data)
      // Calculate today's pomodoros from the full dataset
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      setTodayPomodoros(data.filter(p => !p.interrupted && p.completedAt >= todayISO).length)
      setIsLoading(false)
    }, (error) => {
      console.error('Pomodoros listener error:', error)
      setIsLoading(false)
    })

    return () => {
      unsubTasks()
      unsubProjects()
      unsubPomodoros()
    }
  }, [userId])

  const generateId = () => crypto.randomUUID()

  const addTask = useCallback(async (title: string, projectId?: string, estimatedPomodoros = 1, dueDate?: string) => {
    console.log('[Firestore] addTask called:', { userId, hasDb: !!db, title })
    if (!userId || !db) {
      console.warn('[Firestore] addTask early return - userId:', userId, 'db:', !!db)
      return null
    }
    
    // Firestore doesn't accept undefined values, so only include defined fields
    const now = new Date().toISOString()
    const newTask: GuestTask = {
      id: generateId(),
      title,
      completed: false,
      estimatedPomodoros,
      actualPomodoros: 0,
      createdAt: now,
      updatedAt: now,
    }
    // Only add optional fields if they're defined
    if (projectId !== undefined) newTask.projectId = projectId
    if (dueDate !== undefined) newTask.dueDate = dueDate

    try {
      console.log('[Firestore] Writing task to:', `users/${userId}/tasks/${newTask.id}`)
      await setDoc(doc(db, 'users', userId, 'tasks', newTask.id), newTask)
      console.log('[Firestore] Task written successfully:', newTask.id)
      return newTask
    } catch (error) {
      console.error('[Firestore] Error adding task:', error)
      return null
    }
  }, [userId])

  const updateTask = useCallback(async (id: string, updates: Partial<GuestTask>) => {
    if (!userId || !db) return

    // Filter out undefined values - Firestore doesn't accept them
    // Always set updatedAt on any update
    const cleanUpdates = Object.fromEntries(
      Object.entries({ ...updates, updatedAt: new Date().toISOString() }).filter(([_, v]) => v !== undefined)
    )

    try {
      await setDoc(doc(db, 'users', userId, 'tasks', id), cleanUpdates, { merge: true })
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }, [userId])

  const deleteTask = useCallback(async (id: string) => {
    if (!userId || !db) return

    try {
      await deleteDoc(doc(db, 'users', userId, 'tasks', id))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }, [userId])

  const addProject = useCallback(async (name: string, color = '#6366f1') => {
    if (!userId || !db) return null

    const now = new Date().toISOString()
    const newProject: GuestProject = {
      id: generateId(),
      name,
      color,
      completed: false,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await setDoc(doc(db, 'users', userId, 'projects', newProject.id), newProject)
      return newProject
    } catch (error) {
      console.error('Error adding project:', error)
      return null
    }
  }, [userId])

  const updateProject = useCallback(async (id: string, updates: Partial<GuestProject>) => {
    if (!userId || !db) return

    // Filter out undefined values - Firestore doesn't accept them
    // Always set updatedAt on any update
    const cleanUpdates = Object.fromEntries(
      Object.entries({ ...updates, updatedAt: new Date().toISOString() }).filter(([_, v]) => v !== undefined)
    )

    try {
      await setDoc(doc(db, 'users', userId, 'projects', id), cleanUpdates, { merge: true })
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }, [userId])

  const deleteProject = useCallback(async (id: string) => {
    if (!userId || !db) return

    try {
      await deleteDoc(doc(db, 'users', userId, 'projects', id))
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }, [userId])

  const recordPomodoro = useCallback(async (taskId?: string, interrupted = false, durationMinutes = 25, startedAt?: Date) => {
    if (!userId || !db) return

    const now = new Date()
    const newPomodoro: GuestPomodoro = {
      id: generateId(),
      taskId,
      durationMinutes,
      startedAt: (startedAt || now).toISOString(),
      completedAt: now.toISOString(),
      interrupted,
    }

    try {
      await setDoc(doc(db, 'users', userId, 'pomodoros', newPomodoro.id), newPomodoro)
      
      // Also increment task's actualPomodoros
      if (taskId && !interrupted) {
        const task = tasks.find(t => t.id === taskId)
        if (task) {
          await setDoc(
            doc(db, 'users', userId, 'tasks', taskId), 
            { actualPomodoros: task.actualPomodoros + 1 }, 
            { merge: true }
          )
        }
      }
    } catch (error) {
      console.error('Error recording pomodoro:', error)
    }
  }, [userId, tasks])

  const reorderTasks = useCallback(async (taskIds: string[]) => {
    if (!userId || !db) return
    
    const firestore = db // Store after null check for TypeScript

    try {
      const batch = writeBatch(firestore)
      taskIds.forEach((id, index) => {
        const ref = doc(firestore, 'users', userId, 'tasks', id)
        batch.update(ref, { sortOrder: index })
      })
      await batch.commit()
    } catch (error) {
      console.error('Error reordering tasks:', error)
    }
  }, [userId])

  return {
    tasks,
    projects,
    pomodoros,
    todayPomodoros,
    isLoading,
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

// No automatic sync between localStorage and Firestore.
// Signed in = Firestore (with built-in offline support)
// Signed out = localStorage (guest mode, local only)
