import { Stats as StatsType, DailyStats, ProjectStats, ProductivityInsight, formatDuration } from '../hooks/useStats'

type StatsPeriod = '30d' | '1y' | 'all'

interface StatsProps {
  stats: StatsType
  period: StatsPeriod
  onPeriodChange: (period: StatsPeriod) => void
}

const periodLabels: Record<StatsPeriod, string> = {
  '30d': '30 Days',
  '1y': '1 Year',
  'all': 'All Time',
}

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="card text-center p-5">
      <div 
        className="text-3xl font-semibold tabular-nums"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value}
      </div>
      <div 
        className="text-sm font-medium mt-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </div>
      {subtext && (
        <div 
          className="text-xs mt-1"
          style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}
        >
          {subtext}
        </div>
      )}
    </div>
  )
}

function WeekChart({ data }: { data: DailyStats[] }) {
  const maxValue = Math.max(...data.map(d => d.completed), 1)
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  
  return (
    <div className="card">
      <h3 
        className="font-semibold mb-4"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Last 7 Days
      </h3>
      <div className="flex items-end justify-between h-32 gap-3">
        {data.map((day) => {
          const height = (day.completed / maxValue) * 100
          const date = new Date(day.date)
          const isToday = day.date === new Date().toISOString().split('T')[0]
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-lg transition-all duration-300"
                  style={{ 
                    height: `${Math.max(height, day.completed > 0 ? 10 : 0)}%`,
                    background: isToday ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                  }}
                  title={`${day.completed} pomodoros`}
                />
              </div>
              <span 
                className="text-xs font-medium"
                style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
              >
                {dayNames[date.getDay()]}
              </span>
              <span 
                className="text-xs tabular-nums"
                style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}
              >
                {day.completed || '–'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProjectBreakdown({ projects }: { projects: ProjectStats[] }) {
  const total = projects.reduce((sum, p) => sum + p.pomodoros, 0)
  
  if (projects.length === 0) {
    return (
      <div className="card">
        <h3 
          className="font-semibold mb-4"
          style={{ color: 'var(--color-text-primary)' }}
        >
          By Project
        </h3>
        <p 
          className="text-sm text-center py-4"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          No project data yet. Assign tasks to projects!
        </p>
      </div>
    )
  }
  
  return (
    <div className="card">
      <h3 
        className="font-semibold mb-4"
        style={{ color: 'var(--color-text-primary)' }}
      >
        By Project
      </h3>
      <div className="space-y-4">
        {projects.slice(0, 5).map(project => {
          const percentage = Math.round((project.pomodoros / total) * 100)
          return (
            <div key={project.projectId}>
              <div className="flex justify-between text-sm mb-2">
                <span 
                  className="flex items-center gap-2 font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  {project.projectName}
                </span>
                <span 
                  className="tabular-nums"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {project.pomodoros} ({percentage}%)
                </span>
              </div>
              <div 
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--color-bg-tertiary)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: project.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StreakDisplay({ current, longest }: { current: number; longest: number }) {
  return (
    <div className="card">
      <h3 
        className="font-semibold mb-4"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Streaks
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-3xl mb-2">🔥</div>
          <div 
            className="text-3xl font-semibold tabular-nums"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {current}
          </div>
          <div 
            className="text-xs font-medium mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Current
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">🏆</div>
          <div 
            className="text-3xl font-semibold tabular-nums"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {longest}
          </div>
          <div 
            className="text-xs font-medium mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Best
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductivityInsights({ insights }: { insights: ProductivityInsight }) {
  if (!insights.mostProductiveDay && !insights.mostProductiveHour) {
    return null
  }
  
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const maxDay = Math.max(...insights.byDayOfWeek, 1)
  
  return (
    <div className="card">
      <h3 
        className="font-semibold mb-4"
        style={{ color: 'var(--color-text-primary)' }}
      >
        🧠 Insights
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-5">
        {insights.mostProductiveDay && (
          <div className="text-center">
            <div 
              className="text-xs font-medium uppercase tracking-wide mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Best Day
            </div>
            <div 
              className="text-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {insights.mostProductiveDay}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}
            >
              {insights.peakDayCount} pomodoros
            </div>
          </div>
        )}
        {insights.mostProductiveHour && (
          <div className="text-center">
            <div 
              className="text-xs font-medium uppercase tracking-wide mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Best Hour
            </div>
            <div 
              className="text-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {insights.mostProductiveHour}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}
            >
              {insights.peakHourCount} pomodoros
            </div>
          </div>
        )}
      </div>
      
      <div>
        <div 
          className="text-xs font-medium uppercase tracking-wide mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          By Day of Week
        </div>
        <div className="flex items-end justify-between h-12 gap-1.5">
          {insights.byDayOfWeek.map((count, i) => {
            const height = (count / maxDay) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded transition-all duration-300"
                    style={{ 
                      height: `${Math.max(height, count > 0 ? 10 : 0)}%`,
                      background: 'var(--color-bg-tertiary)',
                    }}
                    title={`${count} pomodoros`}
                  />
                </div>
                <span 
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}
                >
                  {dayNames[i]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Stats({ stats, period, onPeriodChange }: StatsProps) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Period selector */}
      <div className="flex justify-center">
        <div className="segmented-control">
          {(['30d', '1y', 'all'] as StatsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={period === p ? 'active' : ''}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          label="Total Pomodoros" 
          value={stats.totalPomodoros}
          subtext={formatDuration(stats.totalMinutes)}
        />
        <StatCard 
          label="Completion Rate" 
          value={`${stats.completionRate}%`}
          subtext={`${stats.totalInterrupted} interrupted`}
        />
      </div>
      
      <WeekChart data={stats.thisWeek} />
      
      <StreakDisplay current={stats.currentStreak} longest={stats.longestStreak} />
      
      <ProductivityInsights insights={stats.insights} />
      
      {/* Averages */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          label="Daily Average" 
          value={stats.avgPomodorosPerDay}
          subtext="pomodoros/day"
        />
        <StatCard 
          label="Focus Time" 
          value={formatDuration(stats.avgFocusMinutesPerDay)}
          subtext="per active day"
        />
        <StatCard 
          label="Avg Session" 
          value={stats.avgPomodoroLengthLastWeek > 0 ? `${stats.avgPomodoroLengthLastWeek}m` : '—'}
          subtext="last 7 days"
        />
        <StatCard 
          label="Avg Session" 
          value={stats.avgPomodoroLength > 0 ? `${stats.avgPomodoroLength}m` : '—'}
          subtext="all time"
        />
      </div>
      
      <ProjectBreakdown projects={stats.byProject} />
      
      {/* Estimation accuracy */}
      {stats.estimateAccuracy !== 100 && (
        <div className="card text-center">
          <div 
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Estimation Accuracy
          </div>
          <div 
            className="text-base font-medium mt-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {stats.estimateAccuracy < 100 ? (
              <>You tend to <span style={{ color: '#FF9500' }}>underestimate</span> by {100 - stats.estimateAccuracy}%</>
            ) : stats.estimateAccuracy > 100 ? (
              <>You tend to <span style={{ color: 'var(--color-success)' }}>overestimate</span> by {stats.estimateAccuracy - 100}%</>
            ) : (
              <>Perfect estimation! 🎯</>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
