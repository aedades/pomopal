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
    if (!userId || !db) return null
    
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

    try {
      await setDoc(doc(db, 'users', userId, 'tasks', newTask.id), newTask)
      return newTask
    } catch (error) {
      console.error('Error adding task:', error)
      return null
    }
  }, [userId])

  const updateTask = useCallback(async (id: string, updates: Partial<GuestTask>) => {
    if (!userId || !db) return

    try {
      await setDoc(doc(db, 'users', userId, 'tasks', id), updates, { merge: true })
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

    try {
      await setDoc(doc(db, 'users', userId, 'projects', id), updates, { merge: true })
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
 * Migrate localStorage data to Firestore on first sign-in.
 */
export async function migrateLocalToFirestore(
  localData: {
    tasks: GuestTask[]
    projects: GuestProject[]
    pomodoros: GuestPomodoro[]
  },
  userId: string
): Promise<boolean> {
  if (!db || !isFirebaseConfigured) {
    console.error('Firebase not configured')
    return false
  }

  // Store reference after null check for TypeScript
  const firestore = db

  console.log('Migrating local data to Firestore for user:', userId)
  console.log('Tasks:', localData.tasks.length)
  console.log('Projects:', localData.projects.length)
  console.log('Pomodoros:', localData.pomodoros.length)

  try {
    const batch = writeBatch(firestore)

    // Migrate tasks
    for (const task of localData.tasks) {
      const ref = doc(firestore, 'users', userId, 'tasks', task.id)
      batch.set(ref, task)
    }

    // Migrate projects
    for (const project of localData.projects) {
      const ref = doc(firestore, 'users', userId, 'projects', project.id)
      batch.set(ref, project)
    }

    // Migrate pomodoros (limit to last 500 to avoid batch limits)
    for (const pomo of localData.pomodoros.slice(0, 500)) {
      const ref = doc(firestore, 'users', userId, 'pomodoros', pomo.id)
      batch.set(ref, pomo)
    }

    await batch.commit()
    console.log('Migration complete!')
    return true
  } catch (error) {
    console.error('Migration failed:', error)
    return false
  }
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
