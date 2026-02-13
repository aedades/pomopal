import { useState, useEffect, useCallback } from 'react'
import type { GuestTask, GuestProject, GuestPomodoro } from './useLocalStorage'

// TODO: Uncomment when Firebase is configured
// import { 
//   collection, 
//   doc, 
//   setDoc, 
//   deleteDoc, 
//   onSnapshot,
//   query,
//   where,
//   Timestamp 
// } from 'firebase/firestore'
// import { db } from '../lib/firebase'

/**
 * Firestore data hook - mirrors useGuestData interface for seamless switching.
 * 
 * When Firebase is configured:
 * 1. Uncomment the Firebase imports above
 * 2. Uncomment the implementation below
 * 3. Data syncs in real-time across devices
 * 4. Offline persistence handled by Firestore SDK
 */
export function useFirestoreData(userId: string | null) {
  const [tasks, setTasks] = useState<GuestTask[]>([])
  const [projects, setProjects] = useState<GuestProject[]>([])
  const [pomodoros, setPomodoros] = useState<GuestPomodoro[]>([])
  const [todayPomodoros, setTodayPomodoros] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // ============================================================
  // TODO: Real-time listeners (uncomment when Firebase ready)
  // ============================================================
  
  // useEffect(() => {
  //   if (!userId) {
  //     setIsLoading(false)
  //     return
  //   }
  //
  //   // Subscribe to tasks
  //   const tasksQuery = query(collection(db, 'users', userId, 'tasks'))
  //   const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
  //     const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GuestTask[]
  //     setTasks(data)
  //   })
  //
  //   // Subscribe to projects
  //   const projectsQuery = query(collection(db, 'users', userId, 'projects'))
  //   const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
  //     const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GuestProject[]
  //     setProjects(data)
  //   })
  //
  //   // Subscribe to today's pomodoros
  //   const today = new Date().toISOString().split('T')[0]
  //   const pomodorosQuery = query(
  //     collection(db, 'users', userId, 'pomodoros'),
  //     where('completedAt', '>=', today)
  //   )
  //   const unsubPomodoros = onSnapshot(pomodorosQuery, (snapshot) => {
  //     const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GuestPomodoro[]
  //     setPomodoros(data)
  //     setTodayPomodoros(data.filter(p => !p.interrupted).length)
  //   })
  //
  //   setIsLoading(false)
  //
  //   return () => {
  //     unsubTasks()
  //     unsubProjects()
  //     unsubPomodoros()
  //   }
  // }, [userId])

  // Stub: just mark as not loading
  useEffect(() => {
    setIsLoading(false)
  }, [userId])

  // ============================================================
  // CRUD Operations (stubbed - uncomment when Firebase ready)
  // ============================================================

  const generateId = () => crypto.randomUUID()

  const addTask = useCallback((title: string, projectId?: string, estimatedPomodoros = 1) => {
    if (!userId) return null
    
    const newTask: GuestTask = {
      id: generateId(),
      title,
      projectId,
      completed: false,
      estimatedPomodoros,
      actualPomodoros: 0,
      createdAt: new Date().toISOString(),
    }

    // TODO: Uncomment when Firebase ready
    // await setDoc(doc(db, 'users', userId, 'tasks', newTask.id), newTask)
    
    // Stub: update local state
    setTasks(prev => [newTask, ...prev])
    return newTask
  }, [userId])

  const updateTask = useCallback((id: string, updates: Partial<GuestTask>) => {
    if (!userId) return

    // TODO: Uncomment when Firebase ready
    // await setDoc(doc(db, 'users', userId, 'tasks', id), updates, { merge: true })
    
    // Stub: update local state
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [userId])

  const deleteTask = useCallback((id: string) => {
    if (!userId) return

    // TODO: Uncomment when Firebase ready
    // await deleteDoc(doc(db, 'users', userId, 'tasks', id))
    
    // Stub: update local state
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [userId])

  const addProject = useCallback((name: string, color = '#6366f1') => {
    if (!userId) return null

    const newProject: GuestProject = {
      id: generateId(),
      name,
      color,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    // TODO: Uncomment when Firebase ready
    // await setDoc(doc(db, 'users', userId, 'projects', newProject.id), newProject)
    
    // Stub: update local state
    setProjects(prev => [newProject, ...prev])
    return newProject
  }, [userId])

  const updateProject = useCallback((id: string, updates: Partial<GuestProject>) => {
    if (!userId) return

    // TODO: Uncomment when Firebase ready
    // await setDoc(doc(db, 'users', userId, 'projects', id), updates, { merge: true })
    
    // Stub: update local state
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [userId])

  const deleteProject = useCallback((id: string) => {
    if (!userId) return

    // TODO: Uncomment when Firebase ready
    // await deleteDoc(doc(db, 'users', userId, 'projects', id))
    
    // Stub: update local state
    setProjects(prev => prev.filter(p => p.id !== id))
  }, [userId])

  const recordPomodoro = useCallback((taskId?: string, interrupted = false) => {
    if (!userId) return

    const newPomodoro: GuestPomodoro = {
      id: generateId(),
      taskId,
      durationMinutes: 25,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      interrupted,
    }

    // TODO: Uncomment when Firebase ready
    // await setDoc(doc(db, 'users', userId, 'pomodoros', newPomodoro.id), newPomodoro)
    
    // Stub: update local state
    setPomodoros(prev => [newPomodoro, ...prev])
    if (!interrupted) {
      setTodayPomodoros(prev => prev + 1)
      if (taskId) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, actualPomodoros: t.actualPomodoros + 1 } : t
        ))
      }
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
): Promise<void> {
  console.log('Migrating local data to Firestore for user:', userId)
  console.log('Tasks:', localData.tasks.length)
  console.log('Projects:', localData.projects.length)
  console.log('Pomodoros:', localData.pomodoros.length)

  // TODO: Uncomment when Firebase ready
  // const batch = writeBatch(db)
  //
  // // Migrate tasks
  // for (const task of localData.tasks) {
  //   const ref = doc(db, 'users', userId, 'tasks', task.id)
  //   batch.set(ref, task)
  // }
  //
  // // Migrate projects
  // for (const project of localData.projects) {
  //   const ref = doc(db, 'users', userId, 'projects', project.id)
  //   batch.set(ref, project)
  // }
  //
  // // Migrate pomodoros (maybe limit to last 30 days?)
  // for (const pomo of localData.pomodoros.slice(0, 1000)) {
  //   const ref = doc(db, 'users', userId, 'pomodoros', pomo.id)
  //   batch.set(ref, pomo)
  // }
  //
  // await batch.commit()
  // console.log('Migration complete!')

  // Stub: just log
  alert(`Migration ready! ${localData.tasks.length} tasks, ${localData.projects.length} projects will sync when Firebase is configured.`)
}

/**
 * Clear local storage after successful migration.
 */
export function clearLocalData(): void {
  localStorage.removeItem('pomodoro:guest:tasks')
  localStorage.removeItem('pomodoro:guest:projects')
  localStorage.removeItem('pomodoro:guest:pomodoros')
  localStorage.removeItem('pomodoro:guest:today')
  console.log('Local data cleared after migration')
}
