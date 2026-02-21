interface DailyProgressProps {
  current: number
  goal: number | null
}

export default function DailyProgress({ current, goal }: DailyProgressProps) {
  const hasGoal = goal !== null && goal > 0
  const percentage = hasGoal ? Math.min((current / goal) * 100, 100) : 0
  const isComplete = hasGoal && current >= goal

  return (
    <div className="card animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <span 
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Today's Progress
        </span>
        <span 
          className="text-sm font-semibold tabular-nums"
          style={{ color: isComplete ? 'var(--color-success)' : 'var(--color-text-primary)' }}
        >
          {hasGoal ? `${current} / ${goal}` : current}
          <span className="ml-1">🍅</span>
        </span>
      </div>
      
      {hasGoal && (
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${percentage}%`,
              background: isComplete ? 'var(--color-success)' : 'var(--color-accent)',
            }}
          />
        </div>
      )}
      
      {isComplete && (
        <p 
          className="text-center text-sm font-medium mt-3"
          style={{ color: 'var(--color-success)' }}
        >
          🎉 Daily goal reached!
        </p>
      )}
    </div>
  )
}
