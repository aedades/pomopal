import { useEffect, useCallback, useState, useRef } from 'react'
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
  const stats = useStats(pomodoros, rawTasks, rawProjects, {
    excludeWeekendsFromStreak: settings.exclude_weekends_from_streak,
  })
  
  // Show iOS instructions on first visit for iOS users
  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('ios-instructions-seen')
    if (!hasSeenInstructions) {
      // Small delay to let the app render first
      const timer = setTimeout(() => setShowIOSInstructions(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleTimerComplete = useCallback(
    (mode: 'work' | 'shortBreak' | 'longBreak', interrupted: boolean) => {
      if (mode === 'work') {
        recordPomodoro(interrupted)
      }
    },
    [recordPomodoro]
  )

  // Sync timer state changes to Firestore
  const handleTimerStateChange = useCallback((state: TimerState) => {
    if (!isSyncEnabled) return
    
    // Only sync if state actually changed (debounce)
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
    
    // Only apply once on initial load, or when remote state differs significantly
    const remoteKey = JSON.stringify({
      isRunning: remoteState.isRunning,
      mode: remoteState.mode,
      sessionCount: remoteState.sessionCount,
    })
    
    // Skip if we just synced this state ourselves
    if (remoteKey === lastSyncedStateRef.current) return
    
    // Apply remote state if it differs
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
      // Timer just started (non-flow mode) - schedule notification
      const durationMs = timer.timeLeft * 1000
      const notificationType = timer.mode === 'work' ? 'focus' : 
        timer.mode === 'shortBreak' ? 'shortBreak' : 'longBreak'
      scheduleNotification(durationMs, notificationType)
    } else if (wasRunning && !isNowRunning) {
      // Timer just stopped - cancel any scheduled notification
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
          setView('timer') // Switch to timer view if on stats
          // Focus the new task input
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
    // If PWA and needs permission, request it
    if (permission === 'default') {
      requestPermission()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-400 dark:from-gray-900 dark:to-gray-800 transition-colors">
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

        {/* View Toggle */}
        <div className="flex justify-center mb-4">
          <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-full p-1 flex">
            <button
              onClick={() => setView('timer')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                view === 'timer'
                  ? 'bg-white dark:bg-gray-700 text-red-500 dark:text-red-400 shadow'
                  : 'text-white/80 dark:text-gray-400 hover:text-white dark:hover:text-gray-200'
              }`}
            >
              🍅 Timer
            </button>
            <button
              onClick={() => setView('stats')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                view === 'stats'
                  ? 'bg-white dark:bg-gray-700 text-red-500 dark:text-red-400 shadow'
                  : 'text-white/80 dark:text-gray-400 hover:text-white dark:hover:text-gray-200'
              }`}
            >
              📊 Stats
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
            <Stats stats={stats} />
          )}
        </main>

        <footer className="text-center mt-8 text-white/60 dark:text-gray-500 text-sm space-y-2">
          <p className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            <span><kbd className="px-1.5 py-0.5 bg-white/20 rounded">Space</kbd> start/pause</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/20 rounded">S</kbd> skip</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/20 rounded">N</kbd> new task</span>
          </p>
          <p className="text-white/50">
            {isCloudSync ? '☁️ Synced to cloud' : '📦 Data saved locally in your browser'}
          </p>
          <a
            href="https://buymeacoffee.com/aedades"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-full text-sm font-medium transition-colors"
          >
            ☕ Buy me a coffee
          </a>
          <p className="text-white/50 dark:text-gray-500 mt-3">
            Working with a remote team? Try{' '}
            <a
              href="https://aedades.github.io/timezone-buddy/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white dark:hover:text-gray-300 transition-colors"
            >
              Timezone Buddy
            </a>
            {' '}🌍
          </p>
          <p className="text-white/40 dark:text-gray-600 text-xs mt-2">
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
