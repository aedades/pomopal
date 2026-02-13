import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { useGuestData, GuestTask, GuestProject, GuestPomodoro } from '../hooks/useLocalStorage'
import { useFirestoreData, mergeLocalToFirestore, clearLocalData, saveToLocalStorage } from '../hooks/useFirestoreData'
import { useAuth } from './AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'

interface Task {
  id: string
  title: string
  project_id?: string
  project_name?: string
  completed: boolean
  estimated_pomodoros: number
  actual_pomodoros: number
  due_date?: string
  sort_order?: number
}

interface Project {
  id: string
  name: string
  color: string
  completed: boolean
  due_date?: string
}

interface TaskContextType {
  tasks: Task[]
  projects: Project[]
  activeTask: Task | null
  todayPomodoros: number
  pomodoros: GuestPomodoro[]
  guestTasks: GuestTask[]
  guestProjects: GuestProject[]
  isLoading: boolean
  isCloudSync: boolean
  
  addTask: (title: string, projectId?: string, estimate?: number, dueDate?: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  reorderTasks: (taskIds: string[]) => void
  setActiveTask: (task: Task | null) => void
  
  addProject: (name: string, color?: string) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  deleteProjectWithTasks: (id: string) => void
  
  recordPomodoro: (interrupted: boolean) => void
}

const TaskContext = createContext<TaskContextType | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const guestData = useGuestData()
  const firestoreData = useFirestoreData(user?.id ?? null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [hasMigrated, setHasMigrated] = useState(() => {
    return localStorage.getItem('pomodoro:migrated') === 'true'
  })

  // Choose data source based on auth state
  const isCloudSync = !!user
  const dataSource = isCloudSync ? firestoreData : guestData
  const isLoading = isCloudSync ? firestoreData.isLoading : false

  // Track previous user for sign-out detection
  const prevUserRef = useRef<string | null>(null)
  const firestoreDataRef = useRef({ tasks: firestoreData.tasks, projects: firestoreData.projects, pomodoros: firestoreData.pomodoros })
  
  // Keep Firestore data ref updated
  useEffect(() => {
    if (user) {
      firestoreDataRef.current = {
        tasks: firestoreData.tasks,
        projects: firestoreData.projects,
        pomodoros: firestoreData.pomodoros,
      }
    }
  }, [user, firestoreData.tasks, firestoreData.projects, firestoreData.pomodoros])

  // Save Firestore data to localStorage on sign-out
  useEffect(() => {
    const prevUser = prevUserRef.current
    prevUserRef.current = user?.id ?? null
    
    // Detect sign-out: previous user existed, current user is null
    if (prevUser && !user) {
      const data = firestoreDataRef.current
      if (data.tasks.length > 0 || data.projects.length > 0) {
        saveToLocalStorage(data)
      }
      // Reset migration flag so merge can run on next sign-in
      setHasMigrated(false)
    }
  }, [user])

  // Merge local data into Firestore on sign-in
  // Waits for Firestore to load so we can compare and only add new items
  useEffect(() => {
    if (user && !hasMigrated && isFirebaseConfigured && !firestoreData.isLoading && guestData.tasks.length > 0) {
      // User signed in and has local data - merge it with cloud data
      mergeLocalToFirestore(
        {
          tasks: guestData.tasks,
          projects: guestData.projects,
          pomodoros: guestData.pomodoros,
        },
        {
          tasks: firestoreData.tasks,
          projects: firestoreData.projects,
          pomodoros: firestoreData.pomodoros,
        },
        user.id
      ).then((result) => {
        // Mark as migrated so we don't do it again this session
        localStorage.setItem('pomodoro:migrated', 'true')
        setHasMigrated(true)
        // Clear local data after successful merge
        clearLocalData()
        console.log('Merge result:', result.added)
      })
    }
  // Only trigger when loading state changes or user changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasMigrated, firestoreData.isLoading])

  // Convert data to standard format
  const tasks: Task[] = dataSource.tasks.map((t: GuestTask) => ({
    id: t.id,
    title: t.title,
    project_id: t.projectId,
    project_name: dataSource.projects.find((p: GuestProject) => p.id === t.projectId)?.name,
    completed: t.completed,
    estimated_pomodoros: t.estimatedPomodoros,
    actual_pomodoros: t.actualPomodoros,
    due_date: t.dueDate,
    sort_order: t.sortOrder,
  }))

  const projects: Project[] = dataSource.projects.map((p: GuestProject) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    completed: p.completed,
    due_date: p.dueDate,
  }))

  const addTask = useCallback((title: string, projectId?: string, estimate = 1, dueDate?: string) => {
    console.log('[TaskContext] addTask called:', { title, isCloudSync, userId: user?.id })
    dataSource.addTask(title, projectId, estimate, dueDate)
  }, [dataSource, isCloudSync, user?.id])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    // Only include properties that were explicitly provided in updates
    // Use 'in' operator to distinguish between "not provided" vs "provided as undefined"
    const guestUpdates: Partial<GuestTask> = {}
    if ('title' in updates) guestUpdates.title = updates.title
    if ('project_id' in updates) guestUpdates.projectId = updates.project_id
    if ('completed' in updates) guestUpdates.completed = updates.completed
    if ('estimated_pomodoros' in updates) guestUpdates.estimatedPomodoros = updates.estimated_pomodoros
    if ('due_date' in updates) guestUpdates.dueDate = updates.due_date
    
    dataSource.updateTask(id, guestUpdates)
  }, [dataSource])

  const deleteTask = useCallback((id: string) => {
    dataSource.deleteTask(id)
    if (activeTask?.id === id) {
      setActiveTask(null)
    }
  }, [dataSource, activeTask])

  const reorderTasks = useCallback((taskIds: string[]) => {
    dataSource.reorderTasks(taskIds)
  }, [dataSource])

  const addProject = useCallback((name: string, color?: string) => {
    dataSource.addProject(name, color)
  }, [dataSource])

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    const guestUpdates: Partial<GuestProject> = {}
    if ('name' in updates) guestUpdates.name = updates.name
    if ('color' in updates) guestUpdates.color = updates.color
    if ('completed' in updates) guestUpdates.completed = updates.completed
    if ('due_date' in updates) guestUpdates.dueDate = updates.due_date
    dataSource.updateProject(id, guestUpdates)
  }, [dataSource])

  const deleteProject = useCallback((id: string) => {
    dataSource.deleteProject(id)
  }, [dataSource])

  const deleteProjectWithTasks = useCallback((id: string) => {
    // Delete all tasks associated with this project
    const tasksToDelete = dataSource.tasks.filter((t: GuestTask) => t.projectId === id)
    tasksToDelete.forEach((t: GuestTask) => {
      dataSource.deleteTask(t.id)
      if (activeTask?.id === t.id) {
        setActiveTask(null)
      }
    })
    // Then delete the project
    dataSource.deleteProject(id)
  }, [dataSource, activeTask])

  const recordPomodoro = useCallback((interrupted: boolean) => {
    dataSource.recordPomodoro(activeTask?.id, interrupted)
  }, [dataSource, activeTask])

  // Clear active task if it gets completed
  useEffect(() => {
    if (activeTask) {
      const task = tasks.find(t => t.id === activeTask.id)
      if (!task || task.completed) {
        setActiveTask(null)
      }
    }
  }, [tasks, activeTask])

  return (
    <TaskContext.Provider
      value={{
        tasks,
        projects,
        activeTask,
        todayPomodoros: dataSource.todayPomodoros,
        pomodoros: dataSource.pomodoros,
        guestTasks: guestData.tasks,  // Always expose guest data for migration check
        guestProjects: guestData.projects,
        isLoading,
        isCloudSync,
        addTask,
        updateTask,
        deleteTask,
        reorderTasks,
        setActiveTask,
        addProject,
        updateProject,
        deleteProject,
        deleteProjectWithTasks,
        recordPomodoro,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider')
  return ctx
}
