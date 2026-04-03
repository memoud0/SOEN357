import type { SessionRecommendation, Task } from '../../types/models'

const priorityScore: Record<Task['priority'], number> = {
  high: 120,
  medium: 80,
  low: 40,
}

const difficultyScore: Record<Task['difficulty'], number> = {
  easy: 24,
  medium: 18,
  hard: 8,
}

function isDependencyComplete(task: Task, tasksById: Map<string, Task>) {
  return task.dependencies.every((dependencyId) => {
    const dependency = tasksById.get(dependencyId)
    return !dependency || dependency.status === 'done'
  })
}

function taskScore(task: Task) {
  let score = priorityScore[task.priority] + difficultyScore[task.difficulty]
  if (!task.optional) {
    score += 20
  }
  if (task.definitionOfDone.trim().length > 24) {
    score += 12
  }
  if (task.tags.some((tag) => ['must-have', 'core', 'critical'].includes(tag.toLowerCase()))) {
    score += 14
  }
  if (task.source === 'must-have') {
    score += 14
  }

  return score
}

function pickFallbackBalancedTask(candidates: Task[], selectedTaskIds: Set<string>) {
  const easyOrMedium = candidates.find(
    (task) => !selectedTaskIds.has(task.id) && (task.difficulty === 'easy' || task.difficulty === 'medium'),
  )

  return easyOrMedium
}

export function recommendSessionTasks(
  projectTasks: Task[],
  plannedMinutes = 45,
  count = 3,
): SessionRecommendation {
  const tasksById = new Map(projectTasks.map((task) => [task.id, task]))

  const candidates = projectTasks
    .filter((task) => task.status !== 'done' && task.status !== 'skipped')
    .filter((task) => isDependencyComplete(task, tasksById))
    .sort((a, b) => taskScore(b) - taskScore(a))

  if (candidates.length === 0) {
    return {
      taskIds: [],
      totalEstimatedMinutes: 0,
    }
  }

  const selected: Task[] = []
  const selectedIds = new Set<string>()
  let totalMinutes = 0
  const cap = plannedMinutes + 15

  for (const task of candidates) {
    if (selected.length >= count) {
      break
    }

    const withTask = totalMinutes + task.estimatedMinutes
    const shouldAdd =
      selected.length === 0 ||
      withTask <= cap ||
      (selected.length < 2 && task.estimatedMinutes <= plannedMinutes)

    if (shouldAdd) {
      selected.push(task)
      selectedIds.add(task.id)
      totalMinutes += task.estimatedMinutes
    }
  }

  if (!selected.some((task) => task.difficulty === 'easy' || task.difficulty === 'medium')) {
    const fallback = pickFallbackBalancedTask(candidates, selectedIds)
    if (fallback) {
      if (selected.length >= count) {
        const replaced = selected[selected.length - 1]
        const projectedMinutes = totalMinutes - replaced.estimatedMinutes + fallback.estimatedMinutes
        if (projectedMinutes > cap) {
          // Keep the existing capped set if replacing would exceed the time window.
        } else {
          totalMinutes = projectedMinutes
          selectedIds.delete(replaced.id)
          selected[selected.length - 1] = fallback
          selectedIds.add(fallback.id)
        }
      } else {
        const projectedMinutes = totalMinutes + fallback.estimatedMinutes
        if (projectedMinutes <= cap) {
          selected.push(fallback)
          selectedIds.add(fallback.id)
          totalMinutes = projectedMinutes
        }
      }
    }
  }

  if (selected.length < count) {
    for (const task of candidates) {
      if (selected.length >= count) {
        break
      }
      if (selectedIds.has(task.id)) {
        continue
      }
      const withTask = totalMinutes + task.estimatedMinutes
      if (withTask > cap) {
        continue
      }
      selected.push(task)
      selectedIds.add(task.id)
      totalMinutes += task.estimatedMinutes
    }
  }

  const taskIds = selected.slice(0, count).map((task) => task.id)
  const totalEstimatedMinutes = selected
    .slice(0, count)
    .reduce((sum, task) => sum + task.estimatedMinutes, 0)

  return {
    taskIds,
    totalEstimatedMinutes,
  }
}
