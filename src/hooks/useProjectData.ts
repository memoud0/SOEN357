import { useMemo } from 'react'
import { useAppStore } from '../app/store'

export function useProjectData(projectId?: string) {
  const { state } = useAppStore()

  return useMemo(() => {
    const resolvedProjectId = projectId ?? state.activeProjectId
    if (!resolvedProjectId) {
      return {
        project: undefined,
        milestones: [],
        tasks: [],
        sessions: [],
      }
    }

    return {
      project: state.projects.find((project) => project.id === resolvedProjectId),
      milestones: state.milestones
        .filter((milestone) => milestone.projectId === resolvedProjectId)
        .sort((a, b) => a.order - b.order),
      tasks: state.tasks.filter((task) => task.projectId === resolvedProjectId),
      sessions: state.sessions
        .filter((session) => session.projectId === resolvedProjectId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    }
  }, [state, projectId])
}
