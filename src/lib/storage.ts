import { createEmptyState, defaultWizardDraft, seededState } from '../data/defaults'
import type { AppState, WizardDraft } from '../types/models'
import { APP_STORAGE_KEY, APP_VERSION } from './utils'

function cloneState(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state)) as AppState
}

function cloneWizardDraft(draft: WizardDraft): WizardDraft {
  return JSON.parse(JSON.stringify(draft)) as WizardDraft
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function mergeWizardDraft(input: unknown): WizardDraft {
  if (!isRecord(input)) {
    return cloneWizardDraft(defaultWizardDraft)
  }

  const draft = input as Partial<WizardDraft>
  const projectBasics = isRecord(draft.projectBasics) ? draft.projectBasics : {}
  const scopeTimeline = isRecord(draft.scopeTimeline) ? draft.scopeTimeline : {}
  const techFamiliarity = isRecord(draft.techFamiliarity) ? draft.techFamiliarity : {}
  const constraintsQuality = isRecord(draft.constraintsQuality) ? draft.constraintsQuality : {}
  const workStyle = isRecord(draft.workStyle) ? draft.workStyle : {}

  return {
    ...defaultWizardDraft,
    ...draft,
    projectBasics: {
      ...defaultWizardDraft.projectBasics,
      ...projectBasics,
    },
    scopeTimeline: {
      ...defaultWizardDraft.scopeTimeline,
      ...scopeTimeline,
    },
    techFamiliarity: {
      ...defaultWizardDraft.techFamiliarity,
      ...techFamiliarity,
    },
    constraintsQuality: {
      ...defaultWizardDraft.constraintsQuality,
      ...constraintsQuality,
    },
    workStyle: {
      ...defaultWizardDraft.workStyle,
      ...workStyle,
    },
  }
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function migrate(state: Partial<AppState> | null): AppState {
  if (!state || typeof state !== 'object') {
    return cloneState(seededState)
  }

  if (!Array.isArray(state.projects)) {
    return cloneState(seededState)
  }

  if ((state.version ?? 0) > APP_VERSION) {
    return cloneState(seededState)
  }

  const projects = safeArray<AppState['projects'][number]>(state.projects)

  const merged = {
    ...createEmptyState(),
    ...state,
    projects,
    milestones: safeArray<AppState['milestones'][number]>(state.milestones),
    tasks: safeArray<AppState['tasks'][number]>(state.tasks),
    sessions: safeArray<AppState['sessions'][number]>(state.sessions),
    activeProjectId:
      typeof state.activeProjectId === 'string' ? state.activeProjectId : undefined,
    version: APP_VERSION,
  }

  return {
    ...merged,
    wizardDraft: mergeWizardDraft(state.wizardDraft),
  }
}

export function loadAppState(): AppState {
  const raw = localStorage.getItem(APP_STORAGE_KEY)
  if (!raw) {
    return cloneState(seededState)
  }

  return migrate(safeParse(raw) as Partial<AppState>)
}

export function saveAppState(state: AppState) {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state))
}

export function clearAppState() {
  localStorage.removeItem(APP_STORAGE_KEY)
}
