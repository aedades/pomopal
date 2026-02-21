import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import { useSettings } from './hooks/useSettings'
import { useTimer, TimerState } from './hooks/useTimer'
import { useTimerSync } from './hooks/useTimerSync'
import { useNotifications } from './hooks/useNotifications'
import { useTimerNotifications } from './hooks/useTimerNotifications'
import { useStats } from './hooks/useStats'
import Timer from './components/Timer'
import TaskList from './components/TaskList'
import Header from './components/Header'
import DailyProgress from './components/DailyProgress'
import Stats from './components/Stats'
import { IOSInstructions, IOSInstallBanner } from './components/IOSInstructions'
import { TaskProvider, useTaskContext } from './context/TaskContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { VERSION } from './version'

type View = 'timer' | 'stats'
type StatsPeriod = '30d' | '1y' | 'all'

function AppContent() {
  const { user } = useAuth()
  const { settings, updateSettings } = useSettings(user?.id)
  const { activeTask, todayPomodoros, recordPomodoro, pomodoros, rawTasks, rawProjects, isCloudSync } = useTaskContext()
  const { permission, requestPermission } = useNotifications()
  const { scheduleNotification, cancelNotification } = useTimerNotifications()
  const { remoteState, syncTimerState, isSyncEnabled } = useTimerSync()
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const prevRunningRef = useRef(false)
  const appliedRemoteRef = useRef(false)
  const lastSyncedStateRef = useRef<string>('')
  const [view, setView] = useState<View>('timer')
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('30d')
  
  // Filter pomodoros based on selected time period
  const filteredPomodoros = useMemo(() => {
    const now = new Date()
    let cutoff: Date
    
    switch (statsPeriod) {
      case '30d':
        cutoff = new Date(now)
        cutoff.setDate(cutoff.getDate() - 30)
        break
      case '1y':
        cutoff = new Date(now)
        cutoff.setFullYear(cutoff.getFullYear() - 1)
        break
      case 'all':
      default:
        return pomodoros
    }
    
    return pomodoros.filter(p => new Date(p.completedAt) >= cutoff)
  }, [pomodoros, statsPeriod])
  
  const stats = useStats(filteredPomodoros, rawTasks, rawProjects, {
    excludeWeekendsFromStreak: settings.exclude_weekends_from_streak,
  })
  
  // Show iOS instructions on first visit for iOS users
  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('ios-instructions-seen')
    if (!hasSeenInstructions) {
      const timer = setTimeout(() => setShowIOSInstructions(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleTimerComplete = useCallback(
    (mode: 'work' | 'shortBreak' | 'longBreak', interrupted: boolean, durationMinutes: number, startedAt: Date) => {
      if (mode === 'work') {
        recordPomodoro(interrupted, durationMinutes, startedAt)
      }
    },
    [recordPomodoro]
  )

  // Sync timer state changes to Firestore
  const handleTimerStateChange = useCallback((state: TimerState) => {
    if (!isSyncEnabled) return
    
    const stateKey = JSON.stringify({
      isRunning: state.isRunning,
      mode: state.mode,
      sessionCount: state.sessionCount,
    })
    if (stateKey === lastSyncedStateRef.current) return
    lastSyncedStateRef.current = stateKey
    
    syncTimerState(state)
  }, [isSyncEnabled, syncTimerState])

  const timer = useTimer({ 
    settings, 
    onComplete: handleTimerComplete,
    onStateChange: handleTimerStateChange,
  })

  // Apply remote state when it changes (from another device)
  useEffect(() => {
    if (!remoteState || !isSyncEnabled) return
    
    const remoteKey = JSON.stringify({
      isRunning: remoteState.isRunning,
      mode: remoteState.mode,
      sessionCount: remoteState.sessionCount,
    })
    
    if (remoteKey === lastSyncedStateRef.current) return
    
    if (!appliedRemoteRef.current || 
        remoteState.isRunning !== timer.isRunning ||
        remoteState.mode !== timer.mode) {
      timer.applyState(remoteState)
      appliedRemoteRef.current = true
      lastSyncedStateRef.current = remoteKey
    }
  }, [remoteState, isSyncEnabled, timer])

  // Schedule/cancel push notifications when timer starts/stops
  useEffect(() => {
    const wasRunning = prevRunningRef.current
    const isNowRunning = timer.isRunning

    if (!wasRunning && isNowRunning && !timer.isFlowMode) {
      const durationMs = timer.timeLeft * 1000
      const notificationType = timer.mode === 'work' ? 'focus' : 
        timer.mode === 'shortBreak' ? 'shortBreak' : 'longBreak'
      scheduleNotification(durationMs, notificationType)
    } else if (wasRunning && !isNowRunning) {
      cancelNotification()
    }

    prevRunningRef.current = isNowRunning
  }, [timer.isRunning, timer.isFlowMode, timer.timeLeft, timer.mode, scheduleNotification, cancelNotification])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          timer.toggle()
          break
        case 'KeyS':
          e.preventDefault()
          timer.resetTimer(timer.mode)
          break
        case 'KeyN':
          e.preventDefault()
          setView('timer')
          setTimeout(() => {
            const input = document.getElementById('new-task-input')
            input?.focus()
          }, 0)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [timer])

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.dark_mode)
  }, [settings.dark_mode])

  // Update page title with timer
  useEffect(() => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    if (timer.isRunning) {
      document.title = `${formatTime(timer.timeLeft)} - Pomodoro`
    } else {
      document.title = 'Pomodoro Timer'
    }
  }, [timer.timeLeft, timer.isRunning])

  const handleIOSDismiss = () => {
    setShowIOSInstructions(false)
    localStorage.setItem('ios-instructions-seen', 'true')
    if (permission === 'default') {
      requestPermission()
    }
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* iOS Install Banner */}
      <IOSInstallBanner onTap={() => setShowIOSInstructions(true)} />
      
      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <IOSInstructions
          onDismiss={handleIOSDismiss}
          notificationPermission={permission}
        />
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Header
          settings={settings}
          onUpdateSettings={updateSettings}
        />

        {/* View Toggle - Apple segmented control */}
        <div className="flex justify-center mb-6">
          <div className="segmented-control">
            <button
              onClick={() => setView('timer')}
              className={view === 'timer' ? 'active' : ''}
            >
              Timer
            </button>
            <button
              onClick={() => setView('stats')}
              className={view === 'stats' ? 'active' : ''}
            >
              Statistics
            </button>
          </div>
        </div>

        <main className="space-y-6">
          {view === 'timer' ? (
            <>
              <DailyProgress
                current={todayPomodoros}
                goal={settings.daily_goal_enabled ? settings.daily_pomodoro_goal : null}
              />

              <Timer
                mode={timer.mode}
                timeLeft={timer.timeLeft}
                isRunning={timer.isRunning}
                sessionCount={timer.sessionCount}
                activeTask={activeTask?.title ?? null}
                onToggle={timer.toggle}
                onReset={() => timer.resetTimer(timer.mode)}
                onModeChange={timer.setMode}
                settings={settings}
                isFlowMode={timer.isFlowMode}
                elapsed={timer.elapsed}
                isOverTarget={timer.isOverTarget}
                targetTime={timer.targetTime}
              />

              <TaskList />
            </>
          ) : (
            <Stats stats={stats} period={statsPeriod} onPeriodChange={setStatsPeriod} />
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 space-y-4">
          {/* Keyboard shortcuts */}
          <div className="flex flex-wrap justify-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="flex items-center gap-1.5">
              <kbd 
                className="px-2 py-1 rounded-md text-xs font-medium"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                Space
              </kbd>
              start/pause
            </span>
            <span className="flex items-center gap-1.5">
              <kbd 
                className="px-2 py-1 rounded-md text-xs font-medium"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                S
              </kbd>
              skip
            </span>
            <span className="flex items-center gap-1.5">
              <kbd 
                className="px-2 py-1 rounded-md text-xs font-medium"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                N
              </kbd>
              new task
            </span>
          </div>
          
          {/* Sync status */}
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {isCloudSync ? '☁️ Synced to cloud' : '💾 Saved locally'}
          </p>
          
          {/* Support link */}
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <a
              href="https://buymeacoffee.com/aedades"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Support this project ☕
            </a>
          </p>
          
          {/* Timezone Buddy promo */}
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Working remotely?{' '}
            <a
              href="https://aedades.github.io/timezone-buddy/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: 'var(--color-accent)' }}
            >
              Timezone Buddy
            </a>
            {' '}🌍
          </p>
          
          {/* Version */}
          <p className="text-xs opacity-50" style={{ color: 'var(--color-text-secondary)' }}>
            v{VERSION}
          </p>
        </footer>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <AppContent />
      </TaskProvider>
    </AuthProvider>
  )
}
