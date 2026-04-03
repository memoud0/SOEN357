import type { Milestone, Session, Task } from '../../types/models'
import { recommendSessionTasks } from '../session/recommendation'

function toLocalDayKey(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromLocalDayKey(key: string) {
  const [year, month, day] = key.split('-').map((value) => Number(value))
  return new Date(year, month - 1, day)
}

export function completionPercentage(tasks: Task[]) {
  if (tasks.length === 0) {
    return 0
  }

  const done = tasks.filter((task) => task.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}

export function milestoneProgress(milestones: Milestone[], tasks: Task[]) {
  return milestones
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((milestone) => {
      const related = tasks.filter((task) => task.milestoneId === milestone.id)
      const doneCount = related.filter((task) => task.status === 'done').length
      const total = related.length
      const hasStartedWork = related.some((task) => task.status === 'in_progress')

      const status: Milestone['status'] =
        total === 0
          ? 'not_started'
          : doneCount === total
            ? 'done'
            : doneCount > 0 || hasStartedWork
              ? 'in_progress'
              : 'not_started'

      return {
        ...milestone,
        status,
        doneCount,
        total,
      }
    })
}

export function currentStreak(sessions: Session[]) {
  const completedDays = Array.from(
    new Set(
      sessions
        .filter((session) => session.endStatus === 'completed' && session.endedAt)
        .map((session) => toLocalDayKey(session.endedAt!)),
    ),
  )
    .sort()
    .reverse()

  if (completedDays.length === 0) {
    return 0
  }

  const today = new Date()
  const todayKey = toLocalDayKey(today)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayKey = toLocalDayKey(yesterday)
  const latestCompletedDay = completedDays[0]

  // A current streak is only valid if the user completed a session today or yesterday.
  if (latestCompletedDay !== todayKey && latestCompletedDay !== yesterdayKey) {
    return 0
  }

  let streak = 0
  const firstDate = fromLocalDayKey(latestCompletedDay)
  const completedDaySet = new Set(completedDays)

  for (let offset = 0; offset < completedDays.length; offset += 1) {
    const target = new Date(firstDate)
    target.setDate(firstDate.getDate() - offset)
    const key = toLocalDayKey(target)
    if (completedDaySet.has(key)) {
      streak += 1
    } else {
      break
    }
  }

  return streak
}

export function weeklyActivitySummary(sessions: Session[]) {
  const today = new Date()
  const sessionsByLocalDay = new Map<string, Session[]>()

  sessions.forEach((session) => {
    const key = toLocalDayKey(session.startedAt)
    const current = sessionsByLocalDay.get(key) ?? []
    current.push(session)
    sessionsByLocalDay.set(key, current)
  })

  const days: Array<{ label: string; sessions: number; completedTasks: number }> = []

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const key = toLocalDayKey(day)
    const daySessions = sessionsByLocalDay.get(key) ?? []

    days.push({
      label: day.toLocaleDateString('en-CA', { weekday: 'short' }),
      sessions: daySessions.length,
      completedTasks: daySessions.reduce((sum, session) => sum + session.completedTaskIds.length, 0),
    })
  }

  return days
}

export function topBlockers(sessions: Session[]) {
  const bucket = new Map<string, number>()

  sessions.forEach((session) => {
    const blockerText = session.reflection?.blockers ?? ''
    blockerText
      .split(/[,.;\n]/g)
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 2)
      .forEach((entry) => {
        bucket.set(entry, (bucket.get(entry) ?? 0) + 1)
      })
  })

  return Array.from(bucket.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }))
}

export function nextRecommendedAction(tasks: Task[]) {
  const recommendation = recommendSessionTasks(tasks, 45, 1)
  return recommendation.taskIds[0]
}
