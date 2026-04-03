import { ArrowRight, Flame, ListChecks, PlayCircle, PlusCircle, Timer } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../app/store'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { completionPercentage, currentStreak } from '../features/dashboard/metrics'
import { recommendSessionTasks } from '../features/session/recommendation'
import { useProjectData } from '../hooks/useProjectData'
import { formatDate } from '../lib/utils'
import type { Task } from '../types/models'

export function HomeRoute() {
  const navigate = useNavigate()
  const { state, setActiveProject } = useAppStore()
  const { project, tasks, sessions } = useProjectData()

  const completion = completionPercentage(tasks)
  const streak = currentStreak(sessions)
  const recommendation = recommendSessionTasks(tasks, project?.workStyle.preferredSessionMinutes ?? 45, 3)
  const lastSession = sessions[0]
  const recommendedTasks = recommendation.taskIds
    .map((taskId) => tasks.find((item) => item.id === taskId))
    .filter((task): task is Task => Boolean(task))

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card elevated className="space-y-4 p-6 sm:p-7">
          <Chip className="bg-brand-950/50 text-brand-200 border-brand-700/60">Momentum Coach</Chip>
          <h1 className="text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
            Turn your coding idea into clear momentum.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Momentum guides you from vague project intent to a focused roadmap and a 45-minute execution sprint.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (project) {
                  navigate(`/session/${project.id}`)
                  return
                }
                navigate('/wizard')
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              <PlayCircle size={16} />
              Start a 45-minute session
            </button>
            <Link
              to="/wizard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              <PlusCircle size={16} />
              Create a new project
            </Link>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Current Momentum</h2>
          {project ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Active project</p>
                <p className="mt-1 text-slate-100">{project.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Next tasks</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">{recommendation.taskIds.length}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Completion</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">{completion}%</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Last session</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{formatDate(lastSession?.startedAt)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Streak</p>
                  <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-emerald-300">
                    <Flame size={16} />
                    {streak}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
              No project yet. Start with a short wizard and Momentum will generate your first realistic roadmap.
            </p>
          )}
        </Card>
      </section>

      {project ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Continue Current Project</h3>
              <Chip>{project.timeline}</Chip>
            </div>
            <p className="text-sm text-slate-300">{project.idea}</p>
            <div className="space-y-2 text-sm text-slate-300">
              {recommendation.taskIds.length > 0 ? (
                recommendedTasks.map((task) => {
                  return (
                    <div key={task.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                      <ListChecks size={14} className="text-brand-300" />
                      <span>{task.title}</span>
                      <span className="ml-auto text-xs text-slate-400">{task.estimatedMinutes}m</span>
                    </div>
                  )
                })
              ) : (
                <p className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-400">
                  No eligible tasks right now. Review roadmap dependencies.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/roadmap/${project.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
              >
                Review roadmap
                <ArrowRight size={14} />
              </Link>
              <Link
                to={`/session/${project.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-400"
              >
                <Timer size={14} />
                Jump into session
              </Link>
            </div>
          </Card>

          <Card className="space-y-3">
            <h3 className="text-base font-semibold text-slate-100">Project Hub</h3>
            <p className="text-sm text-slate-400">Switch active project or start a fresh scoped plan.</p>
            <div className="space-y-2">
              {state.projects.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveProject(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                    state.activeProjectId === item.id
                      ? 'border-brand-500 bg-brand-950/30 text-brand-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <span>{item.title}</span>
                  <span className="text-xs text-slate-400">{item.complexity}</span>
                </button>
              ))}
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
