export type ProjectType =
  | 'web app'
  | 'mobile app'
  | 'desktop app'
  | 'API/backend service'
  | 'data/ML tool'
  | 'browser extension'
  | 'other'

export type Complexity = 'tiny' | 'small' | 'medium'
export type Timeline = 'weekend' | '1-2 weeks' | '1 month' | '2+ months'
export type FamiliarityLevel =
  | 'beginner'
  | 'somewhat familiar'
  | 'comfortable'
  | 'advanced'

export type Importance = 'low' | 'medium' | 'high'
export type TaskDifficulty = 'easy' | 'medium' | 'hard'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped'
export type MilestoneStatus = 'not_started' | 'in_progress' | 'done'

export interface TechStack {
  frontend: string[]
  backend: string[]
  database: string[]
  apis: string[]
  mostUnfamiliarTech: string
}

export interface QualityRequirements {
  performance: Importance
  security: Importance
  accessibility: Importance
  timeComplexity: string[]
  spaceComplexity: string[]
}

export interface WorkStyle {
  preferredSessionMinutes: number
  preferredTaskGranularity: 'small bites' | 'balanced' | 'bigger chunks'
}

export interface Project {
  id: string
  title: string
  idea: string
  targetUsers: string
  type: ProjectType
  motivation: string
  complexity: Complexity
  timeline: Timeline
  hoursPerWeek: number
  doneDefinition: string
  mustHaveFeatures: string[]
  niceToHaveFeatures: string[]
  outOfScope: string[]
  techStack: TechStack
  familiarity: FamiliarityLevel
  constraints: string[]
  qualityRequirements: QualityRequirements
  risks: string[]
  abandonmentTriggers: string[]
  workStyle: WorkStyle
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  projectId: string
  title: string
  description: string
  order: number
  status: MilestoneStatus
}

export interface Task {
  id: string
  projectId: string
  milestoneId: string
  title: string
  rationale: string
  definitionOfDone: string
  estimatedMinutes: number
  difficulty: TaskDifficulty
  priority: TaskPriority
  category: 'scope' | 'setup' | 'build' | 'test' | 'polish' | 'delivery' | 'research'
  dependencies: string[]
  status: TaskStatus
  optional: boolean
  createdBy: 'template' | 'user' | 'ai'
  notes: string
  tags: string[]
  source: 'template' | 'must-have' | 'nice-to-have' | 'quality' | 'risk' | 'user-edit'
  createdAt: string
  updatedAt: string
}

export interface Reflection {
  whatWentWell: string
  blockers: string
  nextStep: string
}

export interface Session {
  id: string
  projectId: string
  startedAt: string
  endedAt?: string
  plannedMinutes: number
  firstActionAt?: string
  timeToFirstActionSeconds?: number
  taskIds: string[]
  completedTaskIds: string[]
  skippedTaskIds: string[]
  notes: string
  reflection?: Reflection
  endStatus?: 'completed' | 'exited_early'
}

export interface WizardDraft {
  projectBasics: {
    projectTitle: string
    oneSentenceIdea: string
    targetUsers: string
    projectType: ProjectType
    motivation: string
  }
  scopeTimeline: {
    complexity: Complexity
    timeline: Timeline
    hoursPerWeek: number
    doneDefinition: string
    mustHaveFeatures: string[]
    niceToHaveFeatures: string[]
    outOfScope: string[]
  }
  techFamiliarity: {
    frontendTech: string[]
    backendTech: string[]
    databaseTech: string[]
    apisIntegrations: string[]
    familiarity: FamiliarityLevel
    mostUnfamiliarTech: string
  }
  constraintsQuality: {
    constraints: string[]
    performanceImportance: Importance
    securityImportance: Importance
    accessibilityImportance: Importance
    timeComplexityConcerns: string[]
    spaceComplexityConcerns: string[]
    knownRisks: string[]
  }
  workStyle: {
    preferredSessionLength: number
    taskGranularity: WorkStyle['preferredTaskGranularity']
    abandonmentTriggers: string[]
  }
}

export interface AppState {
  version: number
  projects: Project[]
  milestones: Milestone[]
  tasks: Task[]
  sessions: Session[]
  activeProjectId?: string
  wizardDraft: WizardDraft
}

export interface SessionRecommendation {
  taskIds: string[]
  totalEstimatedMinutes: number
}
