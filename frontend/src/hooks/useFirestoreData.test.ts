import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
// Only import functions that don't need mocking for basic tests
// mergeLocalToFirestore and saveToLocalStorage are dynamically imported in their tests
import { useFirestoreData, migrateLocalToFirestore, clearLocalData } from './useFirestoreData'

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  db: null,
  isFirebaseConfigured: false,
}))

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(),
  orderBy: vi.fn(),
}))

describe('useFirestoreData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty arrays and isLoading=false when userId is null', () => {
    const { result } = renderHook(() => useFirestoreData(null))

    expect(result.current.tasks).toEqual([])
    expect(result.current.projects).toEqual([])
    expect(result.current.pomodoros).toEqual([])
    expect(result.current.todayPomodoros).toBe(0)
    expect(result.current.isLoading).toBe(false)
  })

  it('addTask returns null when Firebase not configured (graceful degradation)', async () => {
    const { result } = renderHook(() => useFirestoreData('user-123'))

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.addTask('Test task')
    })

    expect(returnValue).toBeNull()
  })

  it('addProject returns null when Firebase not configured (graceful degradation)', async () => {
    const { result } = renderHook(() => useFirestoreData('user-123'))

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.addProject('Test project')
    })

    expect(returnValue).toBeNull()
  })
})

describe('migrateLocalToFirestore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when Firebase not configured', async () => {
    const localData = {
      tasks: [{ id: '1', title: 'Task 1', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' }],
      projects: [],
      pomodoros: [],
    }

    const result = await migrateLocalToFirestore(localData, 'user-123')

    expect(result).toBe(false)
  })

  it('returns false when db is null', async () => {
    const localData = {
      tasks: [],
      projects: [],
      pomodoros: [],
    }

    const result = await migrateLocalToFirestore(localData, 'user-123')

    expect(result).toBe(false)
  })
})

describe('useFirestoreData with mocked Firestore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('addTask does not include undefined projectId in document', async () => {
    // Reset modules to set up new mocks
    vi.resetModules()
    
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    const mockDoc = vi.fn().mockReturnValue({ id: 'mock-doc' })
    
    vi.doMock('firebase/firestore', () => ({
      collection: vi.fn(),
      doc: mockDoc,
      setDoc: mockSetDoc,
      deleteDoc: vi.fn(),
      onSnapshot: vi.fn(() => () => {}),
      query: vi.fn(),
      where: vi.fn(),
      writeBatch: vi.fn(),
      orderBy: vi.fn(),
    }))
    
    vi.doMock('../lib/firebase', () => ({
      db: { type: 'mock-firestore' },
      isFirebaseConfigured: true,
    }))
    
    const { useFirestoreData } = await import('./useFirestoreData')
    const { renderHook, act } = await import('@testing-library/react')
    
    const { result } = renderHook(() => useFirestoreData('user-123'))
    
    await act(async () => {
      await result.current.addTask('Test task without project')
    })
    
    // Verify setDoc was called
    expect(mockSetDoc).toHaveBeenCalled()
    
    // Get the document data that was passed to setDoc
    const docData = mockSetDoc.mock.calls[0][1]
    
    // projectId should not be in the document (not even as undefined)
    expect(docData).not.toHaveProperty('projectId')
    expect(docData.title).toBe('Test task without project')
  })

  it('addTask includes projectId when provided', async () => {
    vi.resetModules()
    
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    const mockDoc = vi.fn().mockReturnValue({ id: 'mock-doc' })
    
    vi.doMock('firebase/firestore', () => ({
      collection: vi.fn(),
      doc: mockDoc,
      setDoc: mockSetDoc,
      deleteDoc: vi.fn(),
      onSnapshot: vi.fn(() => () => {}),
      query: vi.fn(),
      where: vi.fn(),
      writeBatch: vi.fn(),
      orderBy: vi.fn(),
    }))
    
    vi.doMock('../lib/firebase', () => ({
      db: { type: 'mock-firestore' },
      isFirebaseConfigured: true,
    }))
    
    const { useFirestoreData } = await import('./useFirestoreData')
    const { renderHook, act } = await import('@testing-library/react')
    
    const { result } = renderHook(() => useFirestoreData('user-123'))
    
    await act(async () => {
      await result.current.addTask('Test task with project', 'project-123')
    })
    
    expect(mockSetDoc).toHaveBeenCalled()
    const docData = mockSetDoc.mock.calls[0][1]
    
    // projectId should be included when provided
    expect(docData.projectId).toBe('project-123')
  })

  it('updateTask filters out undefined values', async () => {
    vi.resetModules()
    
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    const mockDoc = vi.fn().mockReturnValue({ id: 'mock-doc' })
    
    vi.doMock('firebase/firestore', () => ({
      collection: vi.fn(),
      doc: mockDoc,
      setDoc: mockSetDoc,
      deleteDoc: vi.fn(),
      onSnapshot: vi.fn(() => () => {}),
      query: vi.fn(),
      where: vi.fn(),
      writeBatch: vi.fn(),
      orderBy: vi.fn(),
    }))
    
    vi.doMock('../lib/firebase', () => ({
      db: { type: 'mock-firestore' },
      isFirebaseConfigured: true,
    }))
    
    const { useFirestoreData } = await import('./useFirestoreData')
    const { renderHook, act } = await import('@testing-library/react')
    
    const { result } = renderHook(() => useFirestoreData('user-123'))
    
    await act(async () => {
      await result.current.updateTask('task-123', { 
        title: 'Updated title',
        projectId: undefined,  // This should be filtered out
        completed: true,
      })
    })
    
    expect(mockSetDoc).toHaveBeenCalled()
    const docData = mockSetDoc.mock.calls[0][1]
    
    // undefined values should be filtered out
    expect(docData).not.toHaveProperty('projectId')
    expect(docData.title).toBe('Updated title')
    expect(docData.completed).toBe(true)
  })
})

describe('clearLocalData', () => {
  beforeEach(() => {
    // Set up localStorage items
    localStorage.setItem('pomodoro:guest:tasks', JSON.stringify([{ id: '1' }]))
    localStorage.setItem('pomodoro:guest:projects', JSON.stringify([{ id: '2' }]))
    localStorage.setItem('pomodoro:guest:pomodoros', JSON.stringify({ count: 5 }))
    localStorage.setItem('other-key', 'should-remain')
  })

  it('removes correct localStorage keys', () => {
    clearLocalData()

    expect(localStorage.getItem('pomodoro:guest:tasks')).toBeNull()
    expect(localStorage.getItem('pomodoro:guest:projects')).toBeNull()
    expect(localStorage.getItem('pomodoro:guest:pomodoros')).toBeNull()
  })

  it('does not remove unrelated localStorage keys', () => {
    clearLocalData()

    expect(localStorage.getItem('other-key')).toBe('should-remain')
  })
})

describe('saveToLocalStorage', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('saves tasks, projects, and pomodoros to localStorage', async () => {
    // Use dynamic import to get the real function (not mocked)
    vi.doMock('../lib/firebase', () => ({
      db: null,
      isFirebaseConfigured: false,
    }))
    const { saveToLocalStorage } = await import('./useFirestoreData')
    
    const data = {
      tasks: [
        { id: 't1', title: 'Task 1', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' },
        { id: 't2', title: 'Task 2', completed: true, estimatedPomodoros: 2, actualPomodoros: 2, createdAt: '2024-01-02' },
      ],
      projects: [
        { id: 'p1', name: 'Project 1', color: '#ff0000', completed: false, createdAt: '2024-01-01' },
      ],
      pomodoros: [
        { id: 'pom1', taskId: 't1', durationMinutes: 25, startedAt: '2024-01-01T10:00:00Z', completedAt: '2024-01-01T10:25:00Z', interrupted: false },
      ],
    }

    saveToLocalStorage(data)

    expect(JSON.parse(localStorage.getItem('pomodoro:guest:tasks') || '[]')).toEqual(data.tasks)
    expect(JSON.parse(localStorage.getItem('pomodoro:guest:projects') || '[]')).toEqual(data.projects)
    expect(JSON.parse(localStorage.getItem('pomodoro:guest:pomodoros') || '[]')).toEqual(data.pomodoros)
  })

  it('clears migration flag so data can be re-merged on next sign-in', async () => {
    vi.doMock('../lib/firebase', () => ({
      db: null,
      isFirebaseConfigured: false,
    }))
    const { saveToLocalStorage } = await import('./useFirestoreData')
    
    localStorage.setItem('pomodoro:migrated', 'true')

    saveToLocalStorage({ tasks: [], projects: [], pomodoros: [] })

    expect(localStorage.getItem('pomodoro:migrated')).toBeNull()
  })

  it('overwrites existing localStorage data', async () => {
    vi.doMock('../lib/firebase', () => ({
      db: null,
      isFirebaseConfigured: false,
    }))
    const { saveToLocalStorage } = await import('./useFirestoreData')
    
    localStorage.setItem('pomodoro:guest:tasks', JSON.stringify([{ id: 'old', title: 'Old task' }]))

    const newData = {
      tasks: [{ id: 'new', title: 'New task', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' }],
      projects: [],
      pomodoros: [],
    }

    saveToLocalStorage(newData)

    const savedTasks = JSON.parse(localStorage.getItem('pomodoro:guest:tasks') || '[]')
    expect(savedTasks).toHaveLength(1)
    expect(savedTasks[0].id).toBe('new')
  })
})

describe('mergeLocalToFirestore', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns zeros when Firebase not configured', async () => {
    vi.doMock('../lib/firebase', () => ({
      db: null,
      isFirebaseConfigured: false,
    }))
    const { mergeLocalToFirestore } = await import('./useFirestoreData')
    
    const localData = {
      tasks: [{ id: '1', title: 'Task 1', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' }],
      projects: [],
      pomodoros: [],
    }
    const existingData = { tasks: [], projects: [], pomodoros: [] }

    const result = await mergeLocalToFirestore(localData, existingData, 'user-123')

    expect(result.added.tasks).toBe(0)
    expect(result.added.projects).toBe(0)
    expect(result.added.pomodoros).toBe(0)
  })

  it('only adds items that do not exist in cloud (by ID)', async () => {
    vi.resetModules()
    
    const mockSet = vi.fn()
    const mockCommit = vi.fn().mockResolvedValue(undefined)
    const mockWriteBatch = vi.fn().mockReturnValue({ set: mockSet, commit: mockCommit })
    const mockDoc = vi.fn().mockReturnValue({ id: 'mock-doc' })
    
    vi.doMock('firebase/firestore', () => ({
      collection: vi.fn(),
      doc: mockDoc,
      setDoc: vi.fn(),
      deleteDoc: vi.fn(),
      onSnapshot: vi.fn(() => () => {}),
      query: vi.fn(),
      where: vi.fn(),
      writeBatch: mockWriteBatch,
      orderBy: vi.fn(),
    }))
    
    vi.doMock('../lib/firebase', () => ({
      db: { type: 'mock-firestore' },
      isFirebaseConfigured: true,
    }))
    
    const { mergeLocalToFirestore } = await import('./useFirestoreData')
    
    const localData = {
      tasks: [
        { id: 'task-1', title: 'Local Task 1', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' },
        { id: 'task-2', title: 'Local Task 2', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' },
        { id: 'task-3', title: 'Local Task 3', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' },
      ],
      projects: [
        { id: 'proj-1', name: 'Local Project', color: '#ff0000', completed: false, createdAt: '2024-01-01' },
      ],
      pomodoros: [],
    }
    
    // task-1 and proj-1 already exist in cloud
    const existingData = {
      tasks: [
        { id: 'task-1', title: 'Cloud Task 1', completed: true, estimatedPomodoros: 2, actualPomodoros: 2, createdAt: '2024-01-01' },
      ],
      projects: [
        { id: 'proj-1', name: 'Cloud Project', color: '#0000ff', completed: false, createdAt: '2024-01-01' },
      ],
      pomodoros: [],
    }
    
    const result = await mergeLocalToFirestore(localData, existingData, 'user-123')
    
    // Should only add task-2 and task-3 (task-1 exists in cloud)
    expect(result.added.tasks).toBe(2)
    // Should not add proj-1 (exists in cloud)
    expect(result.added.projects).toBe(0)
    
    // Verify batch.set was called only for new items
    expect(mockSet).toHaveBeenCalledTimes(2) // task-2 and task-3
  })

  it('returns zeros when all local items already exist in cloud', async () => {
    vi.resetModules()
    
    const mockSet = vi.fn()
    const mockCommit = vi.fn().mockResolvedValue(undefined)
    const mockWriteBatch = vi.fn().mockReturnValue({ set: mockSet, commit: mockCommit })
    
    vi.doMock('firebase/firestore', () => ({
      collection: vi.fn(),
      doc: vi.fn().mockReturnValue({ id: 'mock-doc' }),
      setDoc: vi.fn(),
      deleteDoc: vi.fn(),
      onSnapshot: vi.fn(() => () => {}),
      query: vi.fn(),
      where: vi.fn(),
      writeBatch: mockWriteBatch,
      orderBy: vi.fn(),
    }))
    
    vi.doMock('../lib/firebase', () => ({
      db: { type: 'mock-firestore' },
      isFirebaseConfigured: true,
    }))
    
    const { mergeLocalToFirestore } = await import('./useFirestoreData')
    
    const localData = {
      tasks: [{ id: 'task-1', title: 'Task', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' }],
      projects: [],
      pomodoros: [],
    }
    
    // Same task already in cloud
    const existingData = {
      tasks: [{ id: 'task-1', title: 'Task', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' }],
      projects: [],
      pomodoros: [],
    }
    
    const result = await mergeLocalToFirestore(localData, existingData, 'user-123')
    
    expect(result.added.tasks).toBe(0)
    expect(result.added.projects).toBe(0)
    expect(result.added.pomodoros).toBe(0)
    // Should not call batch operations when nothing to add
    expect(mockCommit).not.toHaveBeenCalled()
  })

  it('preserves cloud data - does not delete or overwrite existing items', async () => {
    vi.resetModules()
    
    const mockSet = vi.fn()
    const mockCommit = vi.fn().mockResolvedValue(undefined)
    const mockWriteBatch = vi.fn().mockReturnValue({ set: mockSet, commit: mockCommit })
    const mockDoc = vi.fn().mockImplementation((_, __, ___, id) => ({ id }))
    
    vi.doMock('firebase/firestore', () => ({
      collection: vi.fn(),
      doc: mockDoc,
      setDoc: vi.fn(),
      deleteDoc: vi.fn(),
      onSnapshot: vi.fn(() => () => {}),
      query: vi.fn(),
      where: vi.fn(),
      writeBatch: mockWriteBatch,
      orderBy: vi.fn(),
    }))
    
    vi.doMock('../lib/firebase', () => ({
      db: { type: 'mock-firestore' },
      isFirebaseConfigured: true,
    }))
    
    const { mergeLocalToFirestore } = await import('./useFirestoreData')
    
    // Local has an old version of task-1
    const localData = {
      tasks: [{ id: 'task-1', title: 'OLD Local Title', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: '2024-01-01' }],
      projects: [],
      pomodoros: [],
    }
    
    // Cloud has updated version - this should NOT be overwritten
    const existingData = {
      tasks: [{ id: 'task-1', title: 'UPDATED Cloud Title', completed: true, estimatedPomodoros: 3, actualPomodoros: 3, createdAt: '2024-01-01' }],
      projects: [],
      pomodoros: [],
    }
    
    const result = await mergeLocalToFirestore(localData, existingData, 'user-123')
    
    // Should not add anything since task-1 exists
    expect(result.added.tasks).toBe(0)
    // batch.set should NOT be called for existing items
    expect(mockSet).not.toHaveBeenCalled()
  })
})
