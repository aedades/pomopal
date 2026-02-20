import type { Settings } from '../hooks/useSettings'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

interface TimerProps {
  mode: TimerMode
  timeLeft: number
  isRunning: boolean
  sessionCount: number
  activeTask: string | null
  onToggle: () => void
  onReset: () => void
  onModeChange: (mode: TimerMode) => void
  settings: Settings
  // Flow mode props
  isFlowMode?: boolean
  elapsed?: number
  isOverTarget?: boolean
  targetTime?: number
}

export default function Timer({
  mode,
  timeLeft,
  isRunning,
  sessionCount,
  activeTask,
  onToggle,
  onReset,
  onModeChange,
  settings,
  isFlowMode = false,
  elapsed = 0,
  isOverTarget = false,
  targetTime = 0,
}: TimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDuration = (m: TimerMode) => {
    switch (m) {
      case 'work':
        return settings.work_duration_minutes * 60
      case 'shortBreak':
        return settings.short_break_minutes * 60
      case 'longBreak':
        return settings.long_break_minutes * 60
    }
  }

  // Progress calculation
  let progress: number
  if (isFlowMode && mode === 'work') {
    progress = Math.min(100, (elapsed / targetTime) * 100)
  } else {
    progress = ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100
  }

  const modeLabels: Record<TimerMode, string> = {
    work: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
  }

  const getButtonText = () => {
    if (!isRunning) return 'Start'
    if (isFlowMode && mode === 'work') {
      return isOverTarget ? 'Complete' : 'Stop'
    }
    return 'Pause'
  }

  // Ring calculations
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress / 100)

  // Colors based on state
  const getAccentColor = () => {
    if (isOverTarget) return 'var(--color-success)'
    if (mode === 'work') return 'var(--color-accent)'
    return '#5AC8FA' // iOS blue for breaks
  }

  return (
    <div className="card animate-fade-in-up">
      {/* Mode selector - Apple segmented control style */}
      <div className="flex justify-center mb-8">
        <div className="segmented-control">
          {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={mode === m ? 'active' : ''}
            >
              {modeLabels[m]}
              {m === 'work' && settings.flow_mode_enabled && (
                <span className="ml-1 opacity-60">⏱</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Flow mode indicator */}
      {isFlowMode && mode === 'work' && (
        <div className="text-center mb-6">
          <span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ 
              background: isOverTarget ? 'rgba(52, 199, 89, 0.1)' : 'var(--color-bg-tertiary)',
              color: isOverTarget ? 'var(--color-success)' : 'var(--color-text-secondary)'
            }}
          >
            {isOverTarget ? '✓ Goal reached!' : `Flow Mode · Goal: ${formatTime(targetTime)}`}
          </span>
        </div>
      )}

      {/* Timer display - Hero element */}
      <div className="relative w-72 h-72 md:w-80 md:h-80 mx-auto mb-8">
        {/* Background ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 320 320">
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke="var(--color-bg-tertiary)"
            strokeWidth="12"
          />
          {/* Progress ring */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke={getAccentColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease',
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={`text-6xl md:text-7xl font-light tabular-nums tracking-tight ${
              isRunning ? 'animate-gentle-pulse' : ''
            }`}
            style={{ color: isOverTarget ? 'var(--color-success)' : 'var(--color-text-primary)' }}
          >
            {formatTime(timeLeft)}
          </span>
          
          {isFlowMode && mode === 'work' && isRunning && (
            <span 
              className="text-xs font-medium mt-2 uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {isOverTarget ? 'Over target' : 'Counting up'}
            </span>
          )}
          
          {activeTask && (
            <span 
              className="text-sm mt-3 max-w-[200px] truncate px-4 text-center font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {activeTask}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onToggle}
          className={isOverTarget && isRunning ? '' : 'btn-primary'}
          style={isOverTarget && isRunning ? {
            background: 'var(--color-success)',
            color: 'white',
            fontWeight: 600,
            padding: '14px 32px',
            borderRadius: '14px',
            transition: 'all 150ms ease',
          } : undefined}
        >
          {getButtonText()}
        </button>
        <button onClick={onReset} className="btn-secondary">
          Reset
        </button>
      </div>

      {/* Session progress dots */}
      <div className="flex justify-center items-center gap-3 mt-8">
        <div className="flex gap-2">
          {[...Array(settings.long_break_interval)].map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-all duration-300"
              style={{
                background: i < sessionCount % settings.long_break_interval
                  ? 'var(--color-accent)'
                  : 'var(--color-bg-tertiary)',
                transform: i < sessionCount % settings.long_break_interval ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          ))}
        </div>
        <span 
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {sessionCount} completed
        </span>
      </div>
    </div>
  )
}
