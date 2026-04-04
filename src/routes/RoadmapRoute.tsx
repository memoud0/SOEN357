import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp, CircleCheck, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppStore } from '../app/store'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { completionPercentage, milestoneProgress } from '../features/dashboard/metrics'
import { recommendSessionTasks } from '../features/session/recommendation'
import { useProjectData } from '../hooks/useProjectData'
import { toTitleCase } from '../lib/utils'
import type { Task } from '../types/models'

function statusTone(status: Task['status']) {
  switch (status) {
    case 'done':
      return 'success' as const
    case 'skipped':
      return 'warning' as const
    default:
      return 'default' as const
  }
}

export function RoadmapRoute() {
  const { projectId = '' } = useParams()
  const { project, milestones, tasks } = useProjectData(projectId)
  const { updateTask, addTask, removeTask, recomputeMilestones } = useAppStore()

  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({})
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({})
  const [newTaskByMilestone, setNewTaskByMilestone] = useState<Record<string, string>>({})

  const completion = completionPercentage(tasks)

  const milestoneMeta = useMemo(() => milestoneProgress(milestones, tasks), [milestones, tasks])
  const recommendation = recommendSessionTasks(tasks, project?.workStyle.preferredSessionMinutes ?? 45, 3)
  const recommendedTasks = recommendation.taskIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter((task): task is Task => Boolean(task))

  if (!project) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-slate-100">Project not found</h1>
        <p className="mt-2 text-sm text-slate-300">Create or select a project from Home first.</p>
        <Link to="/" className="mt-4 inline-flex rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Back to home
        </Link>
      </Card>
    )
  }

  const toggleMilestone = (milestoneId: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [milestoneId]: !prev[milestoneId],
    }))
  }

  const handleTaskStatus = (taskId: string, done: boolean) => {
    updateTask(taskId, { status: done ? 'done' : 'todo' })
    recomputeMilestones(project.id)
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">{project.title}</h1>
            <p className="text-sm text-slate-300">{project.idea}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip tone="success">{completion}% complete</Chip>
            <Link
              to={`/session/${project.id}`}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
            >
              Start session
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
            <p className="text-xs uppercase text-slate-400">Scope guard</p>
            <p className="mt-1 text-slate-100">Must-have: {project.mustHaveFeatures.length}</p>
            <p className="text-slate-300">Nice-to-have: {project.niceToHaveFeatures.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
            <p className="text-xs uppercase text-slate-400">Out of scope</p>
            <p className="mt-1 text-slate-200">{project.outOfScope.join(', ') || 'No items declared yet'}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
            <p className="text-xs uppercase text-slate-400">Recommended next 3</p>
            <div className="mt-1 space-y-1">
              {recommendedTasks.length > 0 ? (
                recommendedTasks.map((task) => (
                  <p key={task.id} className="text-slate-200">
                    • {task.title}
                  </p>
                ))
              ) : (
                <p className="text-slate-400">No eligible tasks available.</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {milestoneMeta.map((milestone) => {
          const milestoneTasks = tasks.filter((task) => task.milestoneId === milestone.id)
          const isExpanded = expandedMilestones[milestone.id] ?? true

          return (
              <Card
                  key={milestone.id}
                  className={`space-y-3 border-l-4  border-l-slate-500 bg-slate-900/20`}
              >
              <button
                type="button"
                onClick={() => toggleMilestone(milestone.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="text-xs uppercase text-slate-400">Milestone {milestone.order}</p>
                  <h2 className="text-lg font-semibold text-slate-100">{milestone.title}</h2>
                  <p className="text-sm text-slate-300">{milestone.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Chip tone={milestone.status === 'done' ? 'success' : 'default'}>
                    {milestone.doneCount}/{milestone.total}
                  </Chip>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {milestoneTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`rounded-xl border border-slate-800 bg-slate-900/70 p-3 mb-5 border-l-4 ${ task.priority === 'high'
                                    ? 'border-l-red-500'
                                    : task.priority === 'medium'
                                        ? 'border-l-yellow-500'
                                        : 'border-l-green-500'
                            }`}
                        >
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={(event) => handleTaskStatus(task.id, event.target.checked)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                            aria-label={`Mark ${task.title} complete`}
                          />
                          <input
                            value={draftTitles[task.id] ?? task.title}
                            onChange={(event) =>
                              setDraftTitles((prev) => ({ ...prev, [task.id]: event.target.value }))
                            }
                            onBlur={() => {
                              const rawTitle = draftTitles[task.id]
                              const nextTitle = rawTitle?.trim()
                              if (nextTitle && nextTitle !== task.title) {
                                updateTask(task.id, { title: nextTitle })
                              }

                              if (rawTitle !== undefined) {
                                setDraftTitles((prev) => {
                                  const next = { ...prev }
                                  delete next[task.id]
                                  return next
                                })
                              }
                            }}
                            className="min-w-[240px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                          />
                          <select
                            value={task.priority}
                            onChange={(event) => updateTask(task.id, { priority: event.target.value as Task['priority'] })}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                            aria-label="Task priority"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <Chip tone={statusTone(task.status)}>{toTitleCase(task.status.replace('_', ' '))}</Chip>
                          <button
                            type="button"
                            onClick={() => {
                              removeTask(task.id)
                              recomputeMilestones(project.id)
                            }}
                            className="rounded-lg border border-rose-900/80 p-1 text-rose-300 hover:bg-rose-950/40"
                            aria-label={`Remove ${task.title}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                          <Chip>{task.category}</Chip>
                          <Chip>{task.estimatedMinutes} min</Chip>
                          <Chip>{task.difficulty}</Chip>
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{task.rationale}</p>
                        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs text-slate-300">
                          <span className="font-semibold text-slate-200">Definition of done:</span>{' '}
                          {task.definitionOfDone}
                        </div>
                      </div>

                    ))}

                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-3">
                      <input
                        value={newTaskByMilestone[milestone.id] ?? ''}
                        onChange={(event) =>
                          setNewTaskByMilestone((prev) => ({
                            ...prev,
                            [milestone.id]: event.target.value,
                          }))
                        }
                        placeholder="Add a task for this milestone"
                        className="min-w-[240px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const title = newTaskByMilestone[milestone.id]?.trim()
                          if (!title) {
                            return
                          }

                          addTask({
                            projectId: project.id,
                            milestoneId: milestone.id,
                            title,
                          })

                          setNewTaskByMilestone((prev) => ({ ...prev, [milestone.id]: '' }))
                          recomputeMilestones(project.id)
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700"
                      >
                        <Plus size={14} />
                        Add task
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Card>
          )
        })}
      </div>

      <Card className="border-emerald-900/60 bg-emerald-950/20">
        <p className="flex items-center gap-2 text-sm text-emerald-200">
          <CircleCheck size={16} />
          Done is better than endless. Keep scope tight and move to session mode when ready.
        </p>
      </Card>
    </div>
  )
}
