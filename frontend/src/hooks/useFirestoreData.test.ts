import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFirestoreData } from './useFirestoreData'

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
