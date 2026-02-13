import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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

describe('clearLocalData', () => {
  beforeEach(() => {
    // Set up localStorage items
    localStorage.setItem('pomodoro-tasks', JSON.stringify([{ id: '1' }]))
    localStorage.setItem('pomodoro-projects', JSON.stringify([{ id: '2' }]))
    localStorage.setItem('pomodoro-stats', JSON.stringify({ count: 5 }))
    localStorage.setItem('other-key', 'should-remain')
  })

  it('removes correct localStorage keys', () => {
    clearLocalData()

    expect(localStorage.getItem('pomodoro-tasks')).toBeNull()
    expect(localStorage.getItem('pomodoro-projects')).toBeNull()
    expect(localStorage.getItem('pomodoro-stats')).toBeNull()
  })

  it('does not remove unrelated localStorage keys', () => {
    clearLocalData()

    expect(localStorage.getItem('other-key')).toBe('should-remain')
  })
})
