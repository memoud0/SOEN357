import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Pause, Play, RotateCcw, SkipForward, Timer, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../app/store'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { recommendSessionTasks } from '../features/session/recommendation'
import { useProjectData } from '../hooks/useProjectData'
import type { Reflection, Task } from '../types/models'

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function isDependencyMet(task: Task, tasksById: Map<string, Task>) {
  return task.dependencies.every((depId) => {
    const dep = tasksById.get(depId)
    return !dep || dep.status === 'done'
  })
}

export function SessionRoute() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const {
    state,
    startSession,
    markTaskStarted,
    markTaskCompleted,
    markTaskSkipped,
    updateSessionNotes,
    finishSession,
    recomputeMilestones,
  } = useAppStore()

  const { project, tasks } = useProjectData(projectId)

  const defaultPlannedMinutes = project?.workStyle.preferredSessionMinutes ?? 45
  const [plannedMinutes, setPlannedMinutes] = useState(defaultPlannedMinutes)
  const prepRecommendation = useMemo(
    () => recommendSessionTasks(tasks, plannedMinutes, 3),
    [tasks, plannedMinutes],
  )
  const initialTaskIds = useMemo(
    () => recommendSessionTasks(tasks, defaultPlannedMinutes, 3).taskIds,
    [tasks, defaultPlannedMinutes],
  )

  const [phase, setPhase] = useState<'prep' | 'active' | 'reflection'>('prep')
  const [taskIds, setTaskIds] = useState<string[]>(initialTaskIds)
  const [running, setRunning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(defaultPlannedMinutes * 60)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [endStatus, setEndStatus] = useState<'completed' | 'exited_early'>('completed')
  const [reflection, setReflection] = useState<Reflection>({
    whatWentWell: '',
    blockers: '',
    nextStep: '',
  })
  const [flashCompleteTaskId, setFlashCompleteTaskId] = useState<string | null>(null)

  useEffect(() => {
    if (phase !== 'prep') {
      return
    }
    setTaskIds(prepRecommendation.taskIds)
  }, [prepRecommendation.taskIds, phase])

  useEffect(() => {
    setRemainingSeconds(plannedMinutes * 60)
  }, [plannedMinutes])

  useEffect(() => {
    if (!running || phase !== 'active') {
      return
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          setRunning(false)
          if (sessionId) {
            finishSession(sessionId, 'completed')
          }
          setPhase('reflection')
          setEndStatus('completed')
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [running, phase, sessionId, finishSession])

  const allTasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])

  const session = sessionId
    ? state.sessions.find((existingSession) => existingSession.id === sessionId)
    : undefined

  const sessionTasks = taskIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter((task): task is Task => Boolean(task))

  const completedTaskIds = session?.completedTaskIds ?? []
  const skippedTaskIds = session?.skippedTaskIds ?? []
  const completedCount = completedTaskIds.length

  const currentTask = sessionTasks.find(
    (task) => !completedTaskIds.includes(task.id) && !skippedTaskIds.includes(task.id),
  )

  const remainingTaskIds = new Set(
    sessionTasks
      .filter(
        (task) => !completedTaskIds.includes(task.id) && !skippedTaskIds.includes(task.id),
      )
      .map((task) => task.id),
  )
  const queueTasks = sessionTasks.filter(
    (task) => task.id !== currentTask?.id && remainingTaskIds.has(task.id),
  )
  const flashedCompletedTask =
    flashCompleteTaskId
      ? sessionTasks.find((task) => task.id === flashCompleteTaskId)
      : undefined

  const candidateSwapTasks = tasks.filter(
    (task) =>
      !taskIds.includes(task.id) &&
      task.status !== 'done' &&
      task.status !== 'skipped' &&
      isDependencyMet(task, allTasksById),
  )

  if (!project) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-slate-100">No active project found</h1>
        <p className="mt-2 text-sm text-slate-300">Select a project first from the Home screen.</p>
      </Card>
    )
  }

  const beginSession = () => {
    const nextSessionId = startSession(project.id, taskIds, plannedMinutes)
    setSessionId(nextSessionId)
    setPhase('active')
    setRunning(true)
  }

  const moveQueueTask = (taskId: string, direction: -1 | 1) => {
    setTaskIds((current) => {
      const index = current.indexOf(taskId)
      if (index < 0) {
        return current
      }
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current
      }

      const draft = [...current]
      const [item] = draft.splice(index, 1)
      draft.splice(nextIndex, 0, item)
      return draft
    })
  }

  const completeTask = (taskId: string) => {
    if (!sessionId) {
      return
    }

    markTaskCompleted(sessionId, taskId)
    setFlashCompleteTaskId(taskId)
    window.setTimeout(() => setFlashCompleteTaskId(null), 900)
  }

  const skipTask = (taskId: string) => {
    if (!sessionId) {
      return
    }

    markTaskSkipped(sessionId, taskId)
  }

  const endForReflection = (status: 'completed' | 'exited_early') => {
    setRunning(false)
    setEndStatus(status)
    if (sessionId) {
      finishSession(sessionId, status)
    }
    setPhase('reflection')
  }

  const saveReflectionAndGo = () => {
    if (!sessionId) {
      navigate(`/dashboard/${project.id}`)
      return
    }

    finishSession(sessionId, endStatus, reflection)
    recomputeMilestones(project.id)
    navigate(`/dashboard/${project.id}`)
  }

  return (
    <div className="space-y-4">
      {phase === 'prep' ? (
        <Card className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Session Prep</h1>
            <p className="text-sm text-slate-300">
              You only need to focus on these tasks right now. Keep it finite and actionable.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-xs uppercase text-slate-400">Session purpose</p>
              <p className="mt-1 text-sm text-slate-200">Reduce ambiguity by finishing visible tasks only.</p>
            </div>
            <label className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm block">
              <span className="text-xs uppercase text-slate-400">Timer (minutes)</span>
              <input
                type="number"
                value={plannedMinutes}
                min={15}
                max={90}
                onChange={(event) => setPlannedMinutes(Math.max(15, Number(event.target.value) || 45))}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-xs uppercase text-slate-400">Estimated workload</p>
              <p className="mt-1 text-sm text-slate-200">
                {taskIds
                  .map((id) => tasks.find((task) => task.id === id)?.estimatedMinutes ?? 0)
                  .reduce((sum, minutes) => sum + minutes, 0)}{' '}
                minutes total
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {taskIds.length > 0 ? (
              taskIds.map((id, index) => {
                const task = tasks.find((item) => item.id === id)
                if (!task) {
                  return null
                }

                return (
                  <div key={id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip>{index + 1}</Chip>
                      <p className="text-sm text-slate-100">{task.title}</p>
                      <span className="ml-auto text-xs text-slate-400">{task.estimatedMinutes}m</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{task.definitionOfDone}</p>
                    {candidateSwapTasks.length > 0 ? (
                      <label className="mt-2 block text-xs text-slate-400">
                        Swap this task
                        <select
                          onChange={(event) => {
                            const value = event.target.value
                            if (!value) {
                              return
                            }

                            setTaskIds((current) =>
                              current.map((taskId) => (taskId === id ? value : taskId)),
                            )
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                          defaultValue=""
                        >
                          <option value="">Keep current</option>
                          {candidateSwapTasks.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.title} ({candidate.estimatedMinutes}m)
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>
                )
              })
            ) : (
              <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-400">
                No eligible tasks are available yet. Review dependencies on the roadmap.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={beginSession}
            disabled={taskIds.length === 0}
            className="rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-40"
          >
            Start Focus Session
          </button>
        </Card>
      ) : null}

      {phase === 'active' ? (
          <div className="space-y-4">
            <Card className="mx-auto flex flex-col items-center gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">Focus timer</p>
                <Timer size={16} className="text-amber-300" />
              </div>
              <p className="text-4xl font-bold tracking-tight text-amber-300">{formatTimer(remainingSeconds)}</p>
              <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setRunning((current) => !current)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                >
                  {running ? <Pause size={14} /> : <Play size={14} />}
                  {running ? 'Pause' : 'Resume'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                      setRunning(false)
                      setRemainingSeconds(plannedMinutes * 60)
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
              <p className="text-xs text-slate-400">
                First action:{' '}
                {session?.timeToFirstActionSeconds !== undefined &&
                session?.timeToFirstActionSeconds !== null
                    ? `${session.timeToFirstActionSeconds}s after session start`
                    : 'Not recorded yet'}
              </p>
            </Card>
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-100">Current Task</h2>
              <Chip tone="warning">
                {completedCount}/{taskIds.length} done
              </Chip>
            </div>

            <AnimatePresence>
              {flashedCompletedTask ? (
                <motion.div
                  key={flashedCompletedTask.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-lg border border-emerald-700/70 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200"
                >
                  Nice momentum. Completed: {flashedCompletedTask.title}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {currentTask ? (
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h3 className="text-lg font-semibold text-slate-50">{currentTask.title}</h3>
                <p className="text-sm text-slate-300">{currentTask.rationale}</p>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
                  <span className="font-semibold text-slate-100">Definition of done:</span>{' '}
                  {currentTask.definitionOfDone}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => sessionId && markTaskStarted(sessionId, currentTask.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                  >
                    <Play size={14} />
                    Mark started
                  </button>
                  <button
                    type="button"
                    onClick={() => completeTask(currentTask.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    <CheckCircle2 size={14} />
                    Mark completed
                  </button>
                  <button
                    type="button"
                    onClick={() => skipTask(currentTask.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-700 px-3 py-2 text-sm text-amber-300 hover:bg-amber-950/40"
                  >
                    <SkipForward size={14} />
                    Skip task
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/20 p-4 text-sm text-emerald-200">
                Session queue complete. Wrap up with reflection.
              </div>
            )}

            <label className="block space-y-1 text-sm">
              <span className="text-slate-200">Quick notes</span>
              <textarea
                value={session?.notes ?? ''}
                onChange={(event) => sessionId && updateSessionNotes(sessionId, event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                placeholder="Capture blockers or ideas without leaving focus mode."
              />
            </label>
          </Card>

          <div className="space-y-4">

            <Card className="space-y-2">
              <p className="text-sm font-semibold text-slate-200">Queued tasks</p>
              {queueTasks.length > 0 ? (
                queueTasks.map((task, index) => (
                  <div key={task.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-sm">
                    <p className="text-slate-100">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.estimatedMinutes}m · {task.priority}</p>
                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveQueueTask(task.id, -1)}
                        disabled={index === 0}
                        className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 disabled:opacity-30"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQueueTask(task.id, 1)}
                        disabled={index === queueTasks.length - 1}
                        className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 disabled:opacity-30"
                      >
                        Down
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No queued tasks left.</p>
              )}
            </Card>

            <Card className="space-y-2">
              <button
                type="button"
                onClick={() => endForReflection('completed')}
                className="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-400"
              >
                End session & reflect
              </button>
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm('Exit this session now? Progress is kept.')
                  if (confirmed) {
                    endForReflection('exited_early')
                  }
                }}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-rose-900 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/30"
              >
                <XCircle size={14} />
                Exit session
              </button>
            </Card>
          </div>
        </div>
          </div>

      ) : null}

      {phase === 'reflection' ? (
        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-50">Post-Session Reflection</h2>
          <p className="text-sm text-slate-300">
            Momentum gained: {completedCount} tasks completed this session.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
            {sessionTasks
              .filter((task) => completedTaskIds.includes(task.id))
              .map((task) => (
                <p key={task.id}>• {task.title}</p>
              ))}
            {completedTaskIds.length === 0 ? <p>No completed tasks this time.</p> : null}
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-200">What went well?</span>
            <textarea
              value={reflection.whatWentWell}
              onChange={(event) =>
                setReflection((prev) => ({ ...prev, whatWentWell: event.target.value }))
              }
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-200">What blocked you?</span>
            <textarea
              value={reflection.blockers}
              onChange={(event) => setReflection((prev) => ({ ...prev, blockers: event.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-200">What should be the next step?</span>
            <textarea
              value={reflection.nextStep}
              onChange={(event) => setReflection((prev) => ({ ...prev, nextStep: event.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
          <button
            type="button"
            onClick={saveReflectionAndGo}
            className="rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-400"
          >
            Save reflection & open dashboard
          </button>
        </Card>
      ) : null}
    </div>
  )
}
