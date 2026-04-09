import { Activity, ArrowRight, Flame, Target } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { ProgressRing } from '../components/ui/ProgressRing'
import {
  completionPercentage,
  currentStreak,
  milestoneProgress,
  nextRecommendedAction,
  topBlockers,
  weeklyActivitySummary,
} from '../features/dashboard/metrics'
import { useProjectData } from '../hooks/useProjectData'
import { formatDate } from '../lib/utils'

export function DashboardRoute() {
  const { projectId = '' } = useParams()
  const { project, milestones, tasks, sessions } = useProjectData(projectId)

  if (!project) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-slate-100">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-slate-300">Open a project first.</p>
      </Card>
    )
  }

  const completion = completionPercentage(tasks)
  const streak = currentStreak(sessions)
  const weekly = weeklyActivitySummary(sessions)
  const blockers = topBlockers(sessions)
  const milestonesWithMeta = milestoneProgress(milestones, tasks)
  const nextTaskId = nextRecommendedAction(tasks)
  const nextTask = tasks.find((task) => task.id === nextTaskId)

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-50">Momentum Dashboard</h1>
        <p className="text-sm text-slate-300">Good momentum. Keep scope tight and finish the next visible win.</p>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="flex flex-col items-center justify-center gap-3">
          <ProgressRing value={completion} label="Project completion" />
          <p className="text-sm text-slate-300">
            {tasks.filter((task) => task.status === 'done').length}/{tasks.length} tasks completed
          </p>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="text-xs uppercase text-slate-400">Sessions completed</p>
            <p className="mt-1 text-2xl font-bold text-slate-100">
              {sessions.filter((session) => session.endStatus === 'completed').length}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-slate-400">Current streak</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-300">
              <Flame size={20} />
              {streak}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-slate-400">Last session</p>
            <p className="mt-1 text-sm text-slate-100">{formatDate(sessions[0]?.startedAt)}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-slate-400">Project target</p>
            <p className="mt-1 text-sm text-slate-100">{project.doneDefinition}</p>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-brand-300" />
            <h2 className="text-base font-semibold text-slate-100">Weekly Activity</h2>
          </div>
          <div className="grid h-36 grid-cols-7 items-end gap-2">
            {weekly.map((day) => {
              const height = Math.max(8, day.completedTasks * 18 + day.sessions * 10)
              return (
                <div key={day.label} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-brand-500/80"
                    style={{ height }}
                    aria-label={`${day.label}: ${day.sessions} sessions, ${day.completedTasks} completed tasks`}
                  />
                  <p className="text-[10px] text-slate-400">{day.label}</p>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-emerald-300" />
            <h2 className="text-base font-semibold text-slate-100">Milestone Status</h2>
          </div>
          <div className="space-y-2">
            {milestonesWithMeta.map((milestone) => (
              <div key={milestone.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-100">{milestone.title}</p>
                  <Chip tone={milestone.status === 'done' ? 'success' : 'default'}>
                    {milestone.doneCount}/{milestone.total}
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-slate-100">Recent Session History</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <p>{formatDate(session.startedAt)}</p>
                  <Chip tone={session.endStatus === 'completed' ? 'success' : 'warning'}>
                    {session.endStatus ?? 'in progress'}
                  </Chip>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Completed {session.completedTaskIds.length} · First action{' '}
                  {session.timeToFirstActionSeconds !== undefined &&
                  session.timeToFirstActionSeconds !== null
                    ? `${session.timeToFirstActionSeconds}s`
                    : 'n/a'}
                </p>
              </div>
            ))}
            {sessions.length === 0 ? <p className="text-sm text-slate-400">No sessions logged yet.</p> : null}
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-slate-100">Top Blockers</h2>
          <div className="space-y-2">
            {blockers.map((blocker) => (
              <div key={blocker.label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm">
                <p className="text-slate-200">{blocker.label}</p>
                <Chip>{blocker.count}</Chip>
              </div>
            ))}
            {blockers.length === 0 ? <p className="text-sm text-slate-400">No blocker patterns yet.</p> : null}
          </div>
          {nextTask ? (
            <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-3">
              <p className="text-xs uppercase text-emerald-300">Next recommended action</p>
              <p className="mt-1 text-sm text-emerald-100">{nextTask.title}</p>
              <Link
                to={`/session/${project.id}`}
                className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-200 underline"
              >
                Start now
                <ArrowRight size={12} />
              </Link>
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  )
}
