import { useMemo } from 'react'
import { GuestPomodoro, GuestTask, GuestProject } from './useLocalStorage'

export interface DailyStats {
  date: string // YYYY-MM-DD
  completed: number
  interrupted: number
  totalMinutes: number
}

export interface ProjectStats {
  projectId: string
  projectName: string
  color: string
  pomodoros: number
  minutes: number
}

export interface ProductivityInsight {
  mostProductiveDay: string | null // e.g., "Monday"
  mostProductiveHour: string | null // e.g., "10 AM"
  peakDayCount: number
  peakHourCount: number
  byDayOfWeek: number[] // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  byHourOfDay: number[] // [0-23]
}

export interface Stats {
  // Totals
  totalPomodoros: number
  totalMinutes: number
  totalInterrupted: number
  completionRate: number // percentage of non-interrupted
  
  // Streaks
  currentStreak: number
  longestStreak: number
  
  // Averages
  avgPomodorosPerDay: number
  avgFocusMinutesPerDay: number
  
  // By time period
  today: DailyStats
  thisWeek: DailyStats[]
  thisMonth: DailyStats[]
  
  // By project
  byProject: ProjectStats[]
  
  // Task accuracy
  estimateAccuracy: number // ratio of actual/estimated for completed tasks
  
  // Productivity insights
  insights: ProductivityInsight
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

interface StatsOptions {
  excludeWeekendsFromStreak?: boolean
}

export function useStats(
  pomodoros: GuestPomodoro[],
  tasks: GuestTask[],
  projects: GuestProject[],
  options: StatsOptions = {}
): Stats {
  const { excludeWeekendsFromStreak = false } = options
  
  return useMemo(() => {
    const now = new Date()
    const todayStr = getDateString(now)
    
    // Helper to check if a date is a weekend
    const isWeekend = (dateStr: string): boolean => {
      const d = new Date(dateStr)
      const day = d.getDay()
      return day === 0 || day === 6 // Sunday = 0, Saturday = 6
    }
    
    // Get previous working day (skips weekends if excluding)
    const getPrevDay = (dateStr: string): string => {
      const d = new Date(dateStr)
      d.setDate(d.getDate() - 1)
      let result = getDateString(d)
      
      if (excludeWeekendsFromStreak) {
        // Skip weekends
        while (isWeekend(result)) {
          d.setDate(d.getDate() - 1)
          result = getDateString(d)
        }
      }
      return result
    }
    
    // Group pomodoros by date
    const byDate = new Map<string, { completed: number; interrupted: number; minutes: number }>()
    
    for (const p of pomodoros) {
      const date = getDateString(new Date(p.completedAt))
      const existing = byDate.get(date) || { completed: 0, interrupted: 0, minutes: 0 }
      
      if (p.interrupted) {
        existing.interrupted++
      } else {
        existing.completed++
        existing.minutes += p.durationMinutes
      }
      
      byDate.set(date, existing)
    }
    
    // Calculate totals
    const totalPomodoros = pomodoros.filter(p => !p.interrupted).length
    const totalInterrupted = pomodoros.filter(p => p.interrupted).length
    const totalMinutes = pomodoros
      .filter(p => !p.interrupted)
      .reduce((sum, p) => sum + p.durationMinutes, 0)
    
    const completionRate = pomodoros.length > 0
      ? Math.round((totalPomodoros / pomodoros.length) * 100)
      : 100
    
    // Calculate streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Sort dates descending to check streak from today backwards
    const sortedDates = Array.from(byDate.keys())
      .filter(d => byDate.get(d)!.completed > 0)
      .sort((a, b) => b.localeCompare(a))
    
    // Check if today or yesterday (or last weekday if excluding weekends) has activity
    if (sortedDates.length > 0) {
      const lastExpectedDay = getPrevDay(getDateString(new Date(now.getTime() + 86400000))) // Tomorrow - 1 working day = today or last weekday
      const prevExpectedDay = getPrevDay(lastExpectedDay)
      
      // Allow streak if most recent activity is today or the previous expected day
      if (sortedDates[0] === todayStr || sortedDates[0] === lastExpectedDay || sortedDates[0] === prevExpectedDay) {
        // Start counting streak
        let expectedDate = sortedDates[0]
        for (const date of sortedDates) {
          // Skip weekend dates from our data if excluding weekends
          if (excludeWeekendsFromStreak && isWeekend(date)) {
            continue
          }
          
          if (date === expectedDate) {
            currentStreak++
            expectedDate = getPrevDay(expectedDate)
          } else if (getDaysBetween(date, expectedDate) <= 1) {
            // Allow for missing a day check (in case of timezone issues)
            continue
          } else {
            break
          }
        }
      }
    }
    
    // Calculate longest streak
    const sortedDatesAsc = [...sortedDates]
      .filter(d => !excludeWeekendsFromStreak || !isWeekend(d))
      .sort()
    let prevDate = ''
    for (const date of sortedDatesAsc) {
      if (!prevDate) {
        tempStreak = 1
      } else {
        // Check if dates are consecutive (accounting for weekend skipping)
        const expectedNext = new Date(prevDate)
        expectedNext.setDate(expectedNext.getDate() + 1)
        let expectedDateStr = getDateString(expectedNext)
        
        if (excludeWeekendsFromStreak) {
          // Skip weekends
          while (isWeekend(expectedDateStr)) {
            expectedNext.setDate(expectedNext.getDate() + 1)
            expectedDateStr = getDateString(expectedNext)
          }
        }
        
        if (date === expectedDateStr) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
      prevDate = date
    }
    
    // Calculate averages (based on days with activity)
    const activeDays = sortedDates.length || 1
    const avgPomodorosPerDay = Math.round((totalPomodoros / activeDays) * 10) / 10
    const avgFocusMinutesPerDay = Math.round(totalMinutes / activeDays)
    
    // Today's stats
    const todayData = byDate.get(todayStr) || { completed: 0, interrupted: 0, minutes: 0 }
    const today: DailyStats = {
      date: todayStr,
      completed: todayData.completed,
      interrupted: todayData.interrupted,
      totalMinutes: todayData.minutes,
    }
    
    // This week (last 7 days)
    const thisWeek: DailyStats[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = getDateString(d)
      const data = byDate.get(dateStr) || { completed: 0, interrupted: 0, minutes: 0 }
      thisWeek.push({
        date: dateStr,
        completed: data.completed,
        interrupted: data.interrupted,
        totalMinutes: data.minutes,
      })
    }
    
    // This month
    const thisMonth: DailyStats[] = []
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i)
      const dateStr = getDateString(d)
      const data = byDate.get(dateStr) || { completed: 0, interrupted: 0, minutes: 0 }
      thisMonth.push({
        date: dateStr,
        completed: data.completed,
        interrupted: data.interrupted,
        totalMinutes: data.minutes,
      })
    }
    
    // By project
    const projectMap = new Map<string, number>()
    for (const p of pomodoros) {
      if (p.interrupted || !p.taskId) continue
      const task = tasks.find(t => t.id === p.taskId)
      const projectId = task?.projectId || 'none'
      projectMap.set(projectId, (projectMap.get(projectId) || 0) + 1)
    }
    
    const byProject: ProjectStats[] = Array.from(projectMap.entries())
      .map(([projectId, count]) => {
        const project = projects.find(p => p.id === projectId)
        return {
          projectId,
          projectName: project?.name || 'No Project',
          color: project?.color || '#9ca3af',
          pomodoros: count,
          minutes: count * 25, // Assume standard duration
        }
      })
      .sort((a, b) => b.pomodoros - a.pomodoros)
    
    // Estimate accuracy (for completed tasks with both estimated and actual)
    const completedTasks = tasks.filter(t => t.completed && t.estimatedPomodoros > 0)
    let estimateAccuracy = 100
    if (completedTasks.length > 0) {
      const totalEstimated = completedTasks.reduce((sum, t) => sum + t.estimatedPomodoros, 0)
      const totalActual = completedTasks.reduce((sum, t) => sum + t.actualPomodoros, 0)
      // 100% means perfect estimation, <100 means underestimated, >100 means overestimated
      estimateAccuracy = totalEstimated > 0 
        ? Math.round((totalActual / totalEstimated) * 100) 
        : 100
    }
    
    // Productivity insights: by day of week and hour of day
    const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
    const byHourOfDay = Array(24).fill(0) // 0-23
    
    for (const p of pomodoros) {
      if (p.interrupted) continue
      const date = new Date(p.completedAt)
      byDayOfWeek[date.getDay()]++
      byHourOfDay[date.getHours()]++
    }
    
    // Find peak day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const peakDayCount = Math.max(...byDayOfWeek)
    const peakDayIndex = byDayOfWeek.indexOf(peakDayCount)
    const mostProductiveDay = peakDayCount > 0 ? dayNames[peakDayIndex] : null
    
    // Find peak hour
    const peakHourCount = Math.max(...byHourOfDay)
    const peakHourIndex = byHourOfDay.indexOf(peakHourCount)
    const formatHour = (h: number) => {
      if (h === 0) return '12 AM'
      if (h === 12) return '12 PM'
      return h < 12 ? `${h} AM` : `${h - 12} PM`
    }
    const mostProductiveHour = peakHourCount > 0 ? formatHour(peakHourIndex) : null
    
    const insights: ProductivityInsight = {
      mostProductiveDay,
      mostProductiveHour,
      peakDayCount,
      peakHourCount,
      byDayOfWeek,
      byHourOfDay,
    }
    
    return {
      totalPomodoros,
      totalMinutes,
      totalInterrupted,
      completionRate,
      currentStreak,
      longestStreak,
      avgPomodorosPerDay,
      avgFocusMinutesPerDay,
      today,
      thisWeek,
      thisMonth,
      byProject,
      estimateAccuracy,
      insights,
    }
  }, [pomodoros, tasks, projects, excludeWeekendsFromStreak])
}

// Format minutes as hours and minutes
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
