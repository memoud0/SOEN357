import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { createEmptyState, defaultWizardDraft } from '../data/defaults'
import { milestoneProgress } from '../features/dashboard/metrics'
import { generateRoadmapFromWizard } from '../features/roadmap/generator'
import { clearAppState, loadAppState, saveAppState } from '../lib/storage'
import { createId, nowIso } from '../lib/utils'
import type {
  AppState,
  Reflection,
  Session,
  Task,
  WizardDraft,
} from '../types/models'

interface AddTaskInput {
  projectId: string
  milestoneId: string
  title: string
  rationale?: string
  definitionOfDone?: string
  estimatedMinutes?: number
  priority?: Task['priority']
}

interface AppStore {
  state: AppState
  updateWizardSection: <K extends keyof WizardDraft>(section: K, patch: Partial<WizardDraft[K]>) => void
  resetWizardDraft: () => void
  createProjectFromWizard: (draft: WizardDraft) => Promise<string>
  setActiveProject: (projectId: string) => void
  updateTask: (taskId: string, patch: Partial<Task>) => void
  addTask: (input: AddTaskInput) => void
  removeTask: (taskId: string) => void
  startSession: (projectId: string, taskIds: string[], plannedMinutes: number) => string
  recordFirstAction: (sessionId: string) => void
  markTaskStarted: (sessionId: string, taskId: string) => void
  markTaskCompleted: (sessionId: string, taskId: string) => void
  markTaskSkipped: (sessionId: string, taskId: string) => void
  updateSessionNotes: (sessionId: string, notes: string) => void
  finishSession: (sessionId: string, endStatus: Session['endStatus'], reflection?: Reflection) => void
  clearAllData: () => void
  exportResearchData: () => string
  recomputeMilestones: (projectId: string) => void
}

const StoreContext = createContext<AppStore | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadAppState())

  useEffect(() => {
    saveAppState(state)
  }, [state])

  const updateWizardSection: AppStore['updateWizardSection'] = (section, patch) => {
    setState((prev) => ({
      ...prev,
      wizardDraft: {
        ...prev.wizardDraft,
        [section]: {
          ...prev.wizardDraft[section],
          ...patch,
        },
      } as WizardDraft,
    }))
  }

  const resetWizardDraft = () => {
    setState((prev) => ({
      ...prev,
      wizardDraft: defaultWizardDraft,
    }))
  }

  const createProjectFromWizard: AppStore['createProjectFromWizard'] = async (draft) => {
    const { project, milestones, tasks } = await generateRoadmapFromWizard(draft)

    setState((prev) => ({
      ...prev,
      projects: [project, ...prev.projects],
      milestones: [...prev.milestones, ...milestones],
      tasks: [...prev.tasks, ...tasks],
      activeProjectId: project.id,
      wizardDraft: defaultWizardDraft,
    }))

    return project.id
  }

  const recomputeMilestones: AppStore['recomputeMilestones'] = (projectId) => {
    setState((prev) => {
      const projectMilestones = prev.milestones.filter((milestone) => milestone.projectId === projectId)
      const projectTasks = prev.tasks.filter((task) => task.projectId === projectId)
      const nextMilestoneMeta = milestoneProgress(projectMilestones, projectTasks)

      return {
        ...prev,
        milestones: prev.milestones.map((milestone) => {
          const meta = nextMilestoneMeta.find((entry) => entry.id === milestone.id)
          return meta ? { ...milestone, status: meta.status } : milestone
        }),
      }
    })
  }

  const setActiveProject = (projectId: string) => {
    setState((prev) => ({
      ...prev,
      activeProjectId: projectId,
    }))
  }

  const updateTask = (taskId: string, patch: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...patch,
              updatedAt: nowIso(),
            }
          : task,
      ),
    }))
  }

  const addTask = (input: AddTaskInput) => {
    const timestamp = nowIso()

    setState((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: createId('task'),
          projectId: input.projectId,
          milestoneId: input.milestoneId,
          title: input.title,
          rationale: input.rationale ?? 'User-added task for this milestone.',
          definitionOfDone:
            input.definitionOfDone ?? 'Task outcome is visible and manually verified.',
          estimatedMinutes: input.estimatedMinutes ?? 30,
          difficulty: 'easy',
          priority: input.priority ?? 'medium',
          category: 'build',
          dependencies: [],
          status: 'todo',
          optional: false,
          createdBy: 'user',
          notes: '',
          tags: ['user-added'],
          source: 'user-edit',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }))
  }

  const removeTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks
        .filter((task) => task.id !== taskId)
        .map((task) => ({
          ...task,
          dependencies: task.dependencies.filter((dep) => dep !== taskId),
        })),
    }))
  }

  const startSession = (projectId: string, taskIds: string[], plannedMinutes: number) => {
    const sessionId = createId('session')
    const startedAt = nowIso()

    setState((prev) => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        {
          id: sessionId,
          projectId,
          startedAt,
          plannedMinutes,
          taskIds,
          completedTaskIds: [],
          skippedTaskIds: [],
          notes: '',
        },
      ],
      activeProjectId: projectId,
    }))

    return sessionId
  }

  const recordFirstAction = (sessionId: string) => {
    setState((prev) => {
      const session = prev.sessions.find((item) => item.id === sessionId)
      if (!session || session.firstActionAt) {
        return prev
      }

      const firstActionAt = nowIso()
      const deltaSeconds = Math.max(
        0,
        Math.round((new Date(firstActionAt).getTime() - new Date(session.startedAt).getTime()) / 1000),
      )

      return {
        ...prev,
        sessions: prev.sessions.map((item) =>
          item.id === sessionId
            ? {
                ...item,
                firstActionAt,
                timeToFirstActionSeconds: deltaSeconds,
              }
            : item,
        ),
      }
    })
  }

  const markTaskStarted = (sessionId: string, taskId: string) => {
    recordFirstAction(sessionId)
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId && task.status === 'todo'
          ? { ...task, status: 'in_progress', updatedAt: nowIso() }
          : task,
      ),
    }))
  }

  const markTaskCompleted = (sessionId: string, taskId: string) => {
    recordFirstAction(sessionId)
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId ? { ...task, status: 'done', updatedAt: nowIso() } : task,
      ),
      sessions: prev.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              completedTaskIds: Array.from(new Set([...session.completedTaskIds, taskId])),
              skippedTaskIds: session.skippedTaskIds.filter((id) => id !== taskId),
            }
          : session,
      ),
    }))
  }

  const markTaskSkipped = (sessionId: string, taskId: string) => {
    recordFirstAction(sessionId)
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId && task.status !== 'done'
          ? { ...task, status: 'todo', updatedAt: nowIso() }
          : task,
      ),
      sessions: prev.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              skippedTaskIds: Array.from(new Set([...session.skippedTaskIds, taskId])),
              completedTaskIds: session.completedTaskIds.filter((id) => id !== taskId),
            }
          : session,
      ),
    }))
  }

  const updateSessionNotes = (sessionId: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              notes,
            }
          : session,
      ),
    }))
  }

  const finishSession = (
    sessionId: string,
    endStatus: Session['endStatus'],
    reflection?: Reflection,
  ) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              endedAt: session.endedAt ?? nowIso(),
              endStatus: endStatus ?? session.endStatus,
              reflection: reflection ?? session.reflection,
            }
          : session,
      ),
    }))
  }

  const clearAllData = () => {
    clearAppState()
    setState(createEmptyState())
  }

  const exportResearchData = () => {
    return JSON.stringify(
      {
        exportedAt: nowIso(),
        appVersion: state.version,
        activeProjectId: state.activeProjectId,
        projects: state.projects,
        milestones: state.milestones,
        tasks: state.tasks,
        sessions: state.sessions,
      },
      null,
      2,
    )
  }

  const value = useMemo<AppStore>(
    () => ({
      state,
      updateWizardSection,
      resetWizardDraft,
      createProjectFromWizard,
      setActiveProject,
      updateTask,
      addTask,
      removeTask,
      startSession,
      recordFirstAction,
      markTaskStarted,
      markTaskCompleted,
      markTaskSkipped,
      updateSessionNotes,
      finishSession,
      clearAllData,
      exportResearchData,
      recomputeMilestones,
    }),
    [state],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useAppStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useAppStore must be used inside AppStoreProvider')
  }

  return context
}
