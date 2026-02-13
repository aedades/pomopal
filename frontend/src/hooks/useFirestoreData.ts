import { useState, useEffect, useCallback } from 'react'
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  writeBatch,
  orderBy
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

    // Subscribe to today's pomodoros
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()
    
    const pomodorosRef = collection(db, 'users', userId, 'pomodoros')
    const pomodorosQuery = query(
      pomodorosRef,
      where('completedAt', '>=', todayISO),
      orderBy('completedAt', 'desc')
    )
    const unsubPomodoros = onSnapshot(pomodorosQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as GuestPomodoro[]
      setPomodoros(data)
      setTodayPomodoros(data.filter(p => !p.interrupted).length)
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
    const newTask: GuestTask = {
      id: generateId(),
      title,
      completed: false,
      estimatedPomodoros,
      actualPomodoros: 0,
      createdAt: new Date().toISOString(),
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
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
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

    const newProject: GuestProject = {
      id: generateId(),
      name,
      color,
      completed: false,
      createdAt: new Date().toISOString(),
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
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
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

  const recordPomodoro = useCallback(async (taskId?: string, interrupted = false) => {
    if (!userId || !db) return

    const newPomodoro: GuestPomodoro = {
      id: generateId(),
      taskId,
      durationMinutes: 25,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
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

/**
 * Merge localStorage data into Firestore on sign-in.
 * Only adds items that don't already exist in Firestore (by ID).
 * This preserves cloud data while adding any local-only items.
 */
export async function mergeLocalToFirestore(
  localData: {
    tasks: GuestTask[]
    projects: GuestProject[]
    pomodoros: GuestPomodoro[]
  },
  existingData: {
    tasks: GuestTask[]
    projects: GuestProject[]
    pomodoros: GuestPomodoro[]
  },
  userId: string
): Promise<{ added: { tasks: number; projects: number; pomodoros: number } }> {
  if (!db || !isFirebaseConfigured) {
    console.error('Firebase not configured')
    return { added: { tasks: 0, projects: 0, pomodoros: 0 } }
  }

  const firestore = db
  
  // Find items that exist locally but not in Firestore
  const existingTaskIds = new Set(existingData.tasks.map(t => t.id))
  const existingProjectIds = new Set(existingData.projects.map(p => p.id))
  const existingPomodoroIds = new Set(existingData.pomodoros.map(p => p.id))
  
  const newTasks = localData.tasks.filter(t => !existingTaskIds.has(t.id))
  const newProjects = localData.projects.filter(p => !existingProjectIds.has(p.id))
  const newPomodoros = localData.pomodoros.filter(p => !existingPomodoroIds.has(p.id)).slice(0, 500)

  console.log('Merging local data to Firestore for user:', userId)
  console.log('New tasks to add:', newTasks.length, '(existing:', existingData.tasks.length, ')')
  console.log('New projects to add:', newProjects.length, '(existing:', existingData.projects.length, ')')
  console.log('New pomodoros to add:', newPomodoros.length, '(existing:', existingData.pomodoros.length, ')')

  if (newTasks.length === 0 && newProjects.length === 0 && newPomodoros.length === 0) {
    console.log('Nothing new to merge')
    return { added: { tasks: 0, projects: 0, pomodoros: 0 } }
  }

  try {
    const batch = writeBatch(firestore)

    for (const task of newTasks) {
      const ref = doc(firestore, 'users', userId, 'tasks', task.id)
      batch.set(ref, task)
    }

    for (const project of newProjects) {
      const ref = doc(firestore, 'users', userId, 'projects', project.id)
      batch.set(ref, project)
    }

    for (const pomo of newPomodoros) {
      const ref = doc(firestore, 'users', userId, 'pomodoros', pomo.id)
      batch.set(ref, pomo)
    }

    await batch.commit()
    console.log('Merge complete!')
    return { added: { tasks: newTasks.length, projects: newProjects.length, pomodoros: newPomodoros.length } }
  } catch (error) {
    console.error('Merge failed:', error)
    return { added: { tasks: 0, projects: 0, pomodoros: 0 } }
  }
}

/**
 * @deprecated Use mergeLocalToFirestore instead
 */
export async function migrateLocalToFirestore(
  localData: {
    tasks: GuestTask[]
    projects: GuestProject[]
    pomodoros: GuestPomodoro[]
  },
  userId: string
): Promise<boolean> {
  // For backward compatibility, treat as merge with empty existing data
  const result = await mergeLocalToFirestore(localData, { tasks: [], projects: [], pomodoros: [] }, userId)
  return result.added.tasks > 0 || result.added.projects > 0 || result.added.pomodoros > 0
}

/**
 * Clear local storage after successful migration.
 */
export function clearLocalData(): void {
  localStorage.removeItem('pomodoro-tasks')
  localStorage.removeItem('pomodoro-projects')
  localStorage.removeItem('pomodoro-stats')
  console.log('Local data cleared after migration')
}

/**
 * Save Firestore data to localStorage on sign-out.
 * This preserves user data locally so they can continue without signing in.
 */
export function saveToLocalStorage(data: {
  tasks: GuestTask[]
  projects: GuestProject[]
  pomodoros: GuestPomodoro[]
}): void {
  console.log('Saving Firestore data to localStorage on sign-out')
  console.log('Tasks:', data.tasks.length)
  console.log('Projects:', data.projects.length)
  console.log('Pomodoros:', data.pomodoros.length)
  
  localStorage.setItem('pomodoro-tasks', JSON.stringify(data.tasks))
  localStorage.setItem('pomodoro-projects', JSON.stringify(data.projects))
  localStorage.setItem('pomodoro-stats', JSON.stringify(data.pomodoros))
  
  // Reset migration flag so data can be re-migrated on next sign-in
  localStorage.removeItem('pomodoro:migrated')
  
  console.log('Data saved to localStorage')
}
