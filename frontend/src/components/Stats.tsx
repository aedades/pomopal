import { Stats as StatsType, DailyStats, ProjectStats, ProductivityInsight, formatDuration } from '../hooks/useStats'

interface StatsProps {
  stats: StatsType
}

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-white dark:text-gray-100">{value}</div>
      <div className="text-sm text-white/80 dark:text-gray-400">{label}</div>
      {subtext && <div className="text-xs text-white/60 dark:text-gray-500 mt-1">{subtext}</div>}
    </div>
  )
}

function WeekChart({ data }: { data: DailyStats[] }) {
  const maxValue = Math.max(...data.map(d => d.completed), 1)
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  
  return (
    <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4">
      <h3 className="text-white dark:text-gray-200 font-medium mb-4">Last 7 Days</h3>
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((day) => {
          const height = (day.completed / maxValue) * 100
          const date = new Date(day.date)
          const isToday = day.date === new Date().toISOString().split('T')[0]
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t transition-all ${
                    isToday 
                      ? 'bg-white dark:bg-red-400' 
                      : 'bg-white/60 dark:bg-gray-600'
                  }`}
                  style={{ height: `${Math.max(height, day.completed > 0 ? 10 : 0)}%` }}
                  title={`${day.completed} pomodoros`}
                />
              </div>
              <span className="text-xs text-white/80 dark:text-gray-400">
                {dayNames[date.getDay()]}
              </span>
              <span className="text-xs text-white/60 dark:text-gray-500">
                {day.completed || '-'}
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
      <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4">
        <h3 className="text-white dark:text-gray-200 font-medium mb-4">By Project</h3>
        <p className="text-white/60 dark:text-gray-500 text-sm text-center py-4">
          No project data yet. Assign tasks to projects!
        </p>
      </div>
    )
  }
  
  return (
    <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4">
      <h3 className="text-white dark:text-gray-200 font-medium mb-4">By Project</h3>
      <div className="space-y-3">
        {projects.slice(0, 5).map(project => {
          const percentage = Math.round((project.pomodoros / total) * 100)
          return (
            <div key={project.projectId}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white dark:text-gray-300 flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  {project.projectName}
                </span>
                <span className="text-white/80 dark:text-gray-400">
                  {project.pomodoros} ({percentage}%)
                </span>
              </div>
              <div className="h-2 bg-white/20 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
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
    <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4">
      <h3 className="text-white dark:text-gray-200 font-medium mb-3">Streaks</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-3xl">🔥</div>
          <div className="text-2xl font-bold text-white dark:text-gray-100">{current}</div>
          <div className="text-xs text-white/60 dark:text-gray-500">Current</div>
        </div>
        <div className="text-center">
          <div className="text-3xl">🏆</div>
          <div className="text-2xl font-bold text-white dark:text-gray-100">{longest}</div>
          <div className="text-xs text-white/60 dark:text-gray-500">Longest</div>
        </div>
      </div>
    </div>
  )
}

function ProductivityInsights({ insights }: { insights: ProductivityInsight }) {
  if (!insights.mostProductiveDay && !insights.mostProductiveHour) {
    return null // No data yet
  }
  
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const maxDay = Math.max(...insights.byDayOfWeek, 1)
  
  return (
    <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4">
      <h3 className="text-white dark:text-gray-200 font-medium mb-3">🧠 Productivity Insights</h3>
      
      {/* Peak times */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {insights.mostProductiveDay && (
          <div className="text-center">
            <div className="text-sm text-white/60 dark:text-gray-500">Best Day</div>
            <div className="text-lg font-semibold text-white dark:text-gray-100">
              {insights.mostProductiveDay}
            </div>
            <div className="text-xs text-white/50 dark:text-gray-500">
              {insights.peakDayCount} pomodoros
            </div>
          </div>
        )}
        {insights.mostProductiveHour && (
          <div className="text-center">
            <div className="text-sm text-white/60 dark:text-gray-500">Best Hour</div>
            <div className="text-lg font-semibold text-white dark:text-gray-100">
              {insights.mostProductiveHour}
            </div>
            <div className="text-xs text-white/50 dark:text-gray-500">
              {insights.peakHourCount} pomodoros
            </div>
          </div>
        )}
      </div>
      
      {/* Day of week breakdown */}
      <div className="mt-3">
        <div className="text-xs text-white/60 dark:text-gray-500 mb-2">By Day of Week</div>
        <div className="flex items-end justify-between h-12 gap-1">
          {insights.byDayOfWeek.map((count, i) => {
            const height = (count / maxDay) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t bg-white/60 dark:bg-gray-600"
                    style={{ height: `${Math.max(height, count > 0 ? 10 : 0)}%` }}
                    title={`${count} pomodoros`}
                  />
                </div>
                <span className="text-xs text-white/60 dark:text-gray-500">{dayNames[i]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Stats({ stats }: StatsProps) {
  return (
    <div className="space-y-4">
      {/* Top stats row */}
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
      
      {/* Weekly chart */}
      <WeekChart data={stats.thisWeek} />
      
      {/* Streaks */}
      <StreakDisplay current={stats.currentStreak} longest={stats.longestStreak} />
      
      {/* Productivity Insights */}
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
      </div>
      
      {/* By project */}
      <ProjectBreakdown projects={stats.byProject} />
      
      {/* Estimation accuracy */}
      {stats.estimateAccuracy !== 100 && (
        <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-sm text-white/80 dark:text-gray-400">Estimation Accuracy</div>
          <div className="text-lg font-medium text-white dark:text-gray-200 mt-1">
            {stats.estimateAccuracy < 100 ? (
              <>You tend to <span className="text-yellow-300">underestimate</span> by {100 - stats.estimateAccuracy}%</>
            ) : stats.estimateAccuracy > 100 ? (
              <>You tend to <span className="text-green-300">overestimate</span> by {stats.estimateAccuracy - 100}%</>
            ) : (
              <>Perfect estimation! 🎯</>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
