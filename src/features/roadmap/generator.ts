import { defaultWizardDraft } from '../../data/defaults'
import { createId, normalizeTagList, nowIso } from '../../lib/utils'
import type {
  Milestone,
  Project,
  Task,
  TaskDifficulty,
  TaskPriority,
  Timeline,
  WizardDraft,
} from '../../types/models'

interface RoadmapGenerationResult {
  project: Project
  milestones: Milestone[]
  tasks: Task[]
}

interface AiFeatureTask {
  feature: string
  taskTitle: string
  rationale: string
  definitionOfDone: string
}

const projectTypeHint: Record<Project['type'], string> = {
  'web app': 'web UX and browser responsiveness',
  'mobile app': 'mobile navigation and touch ergonomics',
  'desktop app': 'desktop flows and packaging',
  'API/backend service': 'endpoint design and service reliability',
  'data/ML tool': 'data handling and evaluation quality',
  'browser extension': 'extension permissions and browser constraints',
  other: 'core software delivery quality',
}

const projectTypeStarterTask: Record<
  Project['type'],
  { title: string; rationale: string; definitionOfDone: string; category: Task['category'] }
> = {
  'web app': {
    title: 'Create responsive web layout scaffold',
    rationale: 'Web prototypes need early responsive structure to avoid late layout rework.',
    definitionOfDone: 'Desktop and mobile layouts render correctly for core screens.',
    category: 'setup',
  },
  'mobile app': {
    title: 'Define core mobile navigation pattern',
    rationale: 'Mobile flow clarity depends on stable navigation decisions.',
    definitionOfDone: 'Primary mobile navigation and screen transitions are implemented.',
    category: 'setup',
  },
  'desktop app': {
    title: 'Set desktop interaction and window flow baseline',
    rationale: 'Desktop tools need clear navigation and window/state behavior.',
    definitionOfDone: 'Primary desktop flow and state transitions are usable.',
    category: 'setup',
  },
  'API/backend service': {
    title: 'Define service contracts and endpoint skeleton',
    rationale: 'API projects need explicit contracts before implementation detail work.',
    definitionOfDone: 'Core endpoints and request/response contracts are documented and stubbed.',
    category: 'setup',
  },
  'data/ML tool': {
    title: 'Set data pipeline and evaluation baseline',
    rationale: 'Data/ML projects need clear data flow and validation from the start.',
    definitionOfDone: 'Input pipeline and one baseline metric evaluation are implemented.',
    category: 'research',
  },
  'browser extension': {
    title: 'Configure extension manifest and permission baseline',
    rationale: 'Extension scope and permission boundaries must be explicit early.',
    definitionOfDone: 'Manifest, required permissions, and core extension entrypoint are working.',
    category: 'setup',
  },
  other: {
    title: 'Define project-specific foundation task',
    rationale: 'Custom project types still need a clear first technical baseline.',
    definitionOfDone: 'One foundational setup task is implemented and documented.',
    category: 'setup',
  },
}

const timelineTaskCaps: Record<Timeline, { must: number; nice: number; maxTasksPerMilestone: number }> = {
  weekend: { must: 2, nice: 0, maxTasksPerMilestone: 4 },
  '1-2 weeks': { must: 3, nice: 1, maxTasksPerMilestone: 4 },
  '1 month': { must: 4, nice: 2, maxTasksPerMilestone: 5 },
  '2+ months': { must: 5, nice: 3, maxTasksPerMilestone: 6 },
}

function safeDraft(draft?: Partial<WizardDraft>): WizardDraft {
  if (!draft) {
    return defaultWizardDraft
  }

  return {
    ...defaultWizardDraft,
    ...draft,
    projectBasics: {
      ...defaultWizardDraft.projectBasics,
      ...draft.projectBasics,
    },
    scopeTimeline: {
      ...defaultWizardDraft.scopeTimeline,
      ...draft.scopeTimeline,
    },
    techFamiliarity: {
      ...defaultWizardDraft.techFamiliarity,
      ...draft.techFamiliarity,
    },
    constraintsQuality: {
      ...defaultWizardDraft.constraintsQuality,
      ...draft.constraintsQuality,
    },
    workStyle: {
      ...defaultWizardDraft.workStyle,
      ...draft.workStyle,
    },
  }
}

function estimateDifficulty(minutes: number, familiarity: Project['familiarity']): TaskDifficulty {
  const familiarityOffset = familiarity === 'beginner' ? 10 : familiarity === 'advanced' ? -10 : 0
  const adjusted = minutes + familiarityOffset

  if (adjusted <= 35) {
    return 'easy'
  }

  if (adjusted <= 70) {
    return 'medium'
  }

  return 'hard'
}

function pruneByOutOfScope(features: string[], outOfScope: string[]) {
  if (outOfScope.length === 0) {
    return features
  }

  const toTokens = (value: string) => value.toLowerCase().match(/[a-z0-9]+/g) ?? []
  const banned = outOfScope.map((item) => toTokens(item)).filter((tokens) => tokens.length > 0)

  const containsPhraseTokens = (featureTokens: string[], blockedTokens: string[]) => {
    if (blockedTokens.length === 1) {
      return featureTokens.includes(blockedTokens[0])
    }

    for (let index = 0; index <= featureTokens.length - blockedTokens.length; index += 1) {
      const window = featureTokens.slice(index, index + blockedTokens.length)
      if (window.every((token, tokenIndex) => token === blockedTokens[tokenIndex])) {
        return true
      }
    }

    return false
  }

  return features.filter((feature) => {
    const featureTokens = toTokens(feature)
    return !banned.some((blockedTokens) => containsPhraseTokens(featureTokens, blockedTokens))
  })
}

async function buildAiFeatureTasks(draft: WizardDraft): Promise<AiFeatureTask[] | null> {
  const token = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined
  const model = (import.meta.env.VITE_AI_MODEL as string | undefined) ?? 'google/gemini-2.0-flash-exp:free'

  if (!token || draft.scopeTimeline.mustHaveFeatures.length === 0) {
    return null
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You are a planning assistant for student software projects. Return compact JSON only.',
          },
          {
            role: 'user',
            content: `Create concise implementation tasks for must-have features. Context:\n${JSON.stringify(
              {
                projectType: draft.projectBasics.projectType,
                timeline: draft.scopeTimeline.timeline,
                complexity: draft.scopeTimeline.complexity,
                mustHaveFeatures: draft.scopeTimeline.mustHaveFeatures,
                doneDefinition: draft.scopeTimeline.doneDefinition,
              },
            )}\nReturn JSON array of objects with keys: feature, taskTitle, rationale, definitionOfDone. Keep each item under 18 words per field where possible.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = payload.choices?.[0]?.message?.content
    if (!content) {
      return null
    }

    const start = content.indexOf('[')
    const end = content.lastIndexOf(']')
    if (start < 0 || end <= start) {
      return null
    }

    const parsed = JSON.parse(content.slice(start, end + 1)) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }

    const normalized = parsed
      .map((item): AiFeatureTask | null => {
        if (!item || typeof item !== 'object') {
          return null
        }

        const record = item as Record<string, unknown>
        const feature = typeof record.feature === 'string' ? record.feature.trim() : ''
        const taskTitle = typeof record.taskTitle === 'string' ? record.taskTitle.trim() : ''
        const rationale = typeof record.rationale === 'string' ? record.rationale.trim() : ''
        const definitionOfDone =
          typeof record.definitionOfDone === 'string' ? record.definitionOfDone.trim() : ''

        if (!feature || !taskTitle || !rationale || !definitionOfDone) {
          return null
        }

        return {
          feature,
          taskTitle,
          rationale,
          definitionOfDone,
        }
      })
      .filter((item): item is AiFeatureTask => Boolean(item))
      .slice(0, 6)

    return normalized.length > 0 ? normalized : null
  } catch {
    return null
  }
}

function milestoneBlueprint(draft: WizardDraft) {
  const compact = draft.scopeTimeline.timeline === 'weekend' || draft.scopeTimeline.complexity === 'tiny'
  if (compact) {
    return [
      { title: 'Scope & Setup', description: 'Clarify target outcome and set a fast implementation baseline.' },
      { title: 'Core Build', description: 'Deliver only the most valuable must-have functionality.' },
      { title: 'Validation & Demo', description: 'Test, polish essentials, and prepare a clear demo.' },
    ]
  }

  const extended = draft.scopeTimeline.timeline === '2+ months' && draft.scopeTimeline.complexity === 'medium'
  if (extended) {
    return [
      { title: 'Clarify & Scope', description: 'Translate idea into a strict and realistic plan.' },
      { title: 'Setup & Foundation', description: 'Create architecture, tooling, and quality guardrails.' },
      { title: 'Core Feature Build', description: 'Implement must-have value in vertical slices.' },
      { title: 'Validation & Polish', description: 'Improve usability, resilience, and quality requirements.' },
      { title: 'Demo & Delivery', description: 'Finalize narrative, documentation, and handoff outcomes.' },
    ]
  }

  return [
    { title: 'Clarify & Scope', description: 'Define done and keep must-have scope tight.' },
    { title: 'Setup & Foundation', description: 'Establish base architecture and key technical decisions.' },
    { title: 'Core Feature Build', description: 'Ship the essential user value first.' },
    { title: 'Validation & Demo', description: 'Polish, test, and package a report-ready demo.' },
  ]
}

function createTask(
  project: Project,
  milestoneId: string,
  data: {
    title: string
    rationale: string
    definitionOfDone: string
    estimatedMinutes: number
    priority: TaskPriority
    category: Task['category']
    optional?: boolean
    source?: Task['source']
    tags?: string[]
    createdBy?: Task['createdBy']
  },
): Task {
  const timestamp = nowIso()
  return {
    id: createId('task'),
    projectId: project.id,
    milestoneId,
    title: data.title,
    rationale: data.rationale,
    definitionOfDone: data.definitionOfDone,
    estimatedMinutes: data.estimatedMinutes,
    difficulty: estimateDifficulty(data.estimatedMinutes, project.familiarity),
    priority: data.priority,
    category: data.category,
    dependencies: [],
    status: 'todo',
    optional: data.optional ?? false,
    createdBy: data.createdBy ?? 'template',
    notes: '',
    tags: normalizeTagList(data.tags ?? []),
    source: data.source ?? 'template',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function connectDependencies(tasks: Task[]): Task[] {
  return tasks.map((task, index) => {
    if (index === 0) {
      return task
    }

    const previous = tasks[index - 1]
    return {
      ...task,
      dependencies: task.dependencies.length > 0 ? task.dependencies : [previous.id],
    }
  })
}

function fillerTemplate(title: string, index: number) {
  const normalized = title.toLowerCase()
  if (normalized.includes('scope')) {
    return [
      {
        title: 'Clarify acceptance checkpoints',
        rationale: 'Explicit checkpoints reduce uncertainty and rework.',
        definitionOfDone: 'Three acceptance checkpoints are listed and visible.',
        category: 'scope' as const,
      },
      {
        title: 'Create a realistic weekly plan',
        rationale: 'A constrained weekly plan improves follow-through.',
        definitionOfDone: 'Tasks are grouped into a realistic week-by-week order.',
        category: 'scope' as const,
      },
    ][index % 2]
  }

  if (normalized.includes('setup') || normalized.includes('foundation')) {
    return [
      {
        title: 'Document architecture decisions',
        rationale: 'Early architecture notes prevent drift and confusion.',
        definitionOfDone: 'Key stack and folder decisions are documented in one place.',
        category: 'setup' as const,
      },
      {
        title: 'Create baseline quality checks',
        rationale: 'Quick quality checks reduce downstream regressions.',
        definitionOfDone: 'Basic linting and manual sanity checklist are documented.',
        category: 'setup' as const,
      },
    ][index % 2]
  }

  if (normalized.includes('build')) {
    return [
      {
        title: 'Integrate completed feature slices',
        rationale: 'Integration checks keep flow stable as features land.',
        definitionOfDone: 'Core route-to-route flow works after integrating latest tasks.',
        category: 'build' as const,
      },
      {
        title: 'Refine edge-case handling',
        rationale: 'Handling expected edge cases prevents session blockers.',
        definitionOfDone: 'At least 3 edge cases are handled gracefully.',
        category: 'build' as const,
      },
    ][index % 2]
  }

  if (normalized.includes('validation') || normalized.includes('polish')) {
    return [
      {
        title: 'Run manual walkthrough QA',
        rationale: 'A full walkthrough validates readiness for demo.',
        definitionOfDone: 'Critical path is tested end-to-end and notes are recorded.',
        category: 'test' as const,
      },
      {
        title: 'Polish task clarity and microcopy',
        rationale: 'Clear microcopy reduces user hesitation.',
        definitionOfDone: 'Core interaction labels are concise and actionable.',
        category: 'polish' as const,
      },
    ][index % 2]
  }

  return [
    {
      title: 'Prepare demo sequence assets',
      rationale: 'Prepared assets ensure a smooth final delivery.',
      definitionOfDone: 'Screenshots and demo sequence notes are ready.',
      category: 'delivery' as const,
    },
    {
      title: 'Rehearse 5-minute delivery',
      rationale: 'Rehearsal improves confidence and narrative clarity.',
      definitionOfDone: 'A full timed walkthrough is completed once.',
      category: 'delivery' as const,
    },
  ][index % 2]
}

export async function generateRoadmapFromWizard(
  draftInput?: Partial<WizardDraft>,
): Promise<RoadmapGenerationResult> {
  const draft = safeDraft(draftInput)
  const now = nowIso()
  const projectId = createId('project')

  const project: Project = {
    id: projectId,
    title: draft.projectBasics.projectTitle || 'Untitled Momentum Project',
    idea:
      draft.projectBasics.oneSentenceIdea ||
      'Build a focused software project with guided scoping and execution.',
    targetUsers: draft.projectBasics.targetUsers || 'Learners and beginner developers',
    type: draft.projectBasics.projectType,
    motivation: draft.projectBasics.motivation || 'Turn intent into concrete progress.',
    complexity: draft.scopeTimeline.complexity,
    timeline: draft.scopeTimeline.timeline,
    hoursPerWeek: draft.scopeTimeline.hoursPerWeek,
    doneDefinition:
      draft.scopeTimeline.doneDefinition ||
      'A usable prototype demonstrates the core user flow with clear progress tracking.',
    mustHaveFeatures: normalizeTagList(draft.scopeTimeline.mustHaveFeatures),
    niceToHaveFeatures: normalizeTagList(draft.scopeTimeline.niceToHaveFeatures),
    outOfScope: normalizeTagList(draft.scopeTimeline.outOfScope),
    techStack: {
      frontend: normalizeTagList(draft.techFamiliarity.frontendTech),
      backend: normalizeTagList(draft.techFamiliarity.backendTech),
      database: normalizeTagList(draft.techFamiliarity.databaseTech),
      apis: normalizeTagList(draft.techFamiliarity.apisIntegrations),
      mostUnfamiliarTech: draft.techFamiliarity.mostUnfamiliarTech,
    },
    familiarity: draft.techFamiliarity.familiarity,
    constraints: normalizeTagList(draft.constraintsQuality.constraints),
    qualityRequirements: {
      performance: draft.constraintsQuality.performanceImportance,
      security: draft.constraintsQuality.securityImportance,
      accessibility: draft.constraintsQuality.accessibilityImportance,
      timeComplexity: normalizeTagList(draft.constraintsQuality.timeComplexityConcerns),
      spaceComplexity: normalizeTagList(draft.constraintsQuality.spaceComplexityConcerns),
    },
    risks: normalizeTagList(draft.constraintsQuality.knownRisks),
    abandonmentTriggers: normalizeTagList(draft.workStyle.abandonmentTriggers),
    workStyle: {
      preferredSessionMinutes: draft.workStyle.preferredSessionLength || 45,
      preferredTaskGranularity: draft.workStyle.taskGranularity,
    },
    createdAt: now,
    updatedAt: now,
  }

  const milestones = milestoneBlueprint(draft).map((entry, index): Milestone => ({
    id: createId('ms'),
    projectId,
    title: entry.title,
    description: entry.description,
    order: index + 1,
    status: 'not_started',
  }))

  const caps = timelineTaskCaps[project.timeline]
  const mustFeatures = pruneByOutOfScope(project.mustHaveFeatures, project.outOfScope).slice(0, caps.must)
  const niceFeatures = pruneByOutOfScope(project.niceToHaveFeatures, project.outOfScope).slice(0, caps.nice)

  const aiFeatureTasks = await buildAiFeatureTasks(draft)
  const aiByFeature = new Map(
    (aiFeatureTasks ?? [])
      .filter((task) => typeof task.feature === 'string' && task.feature.trim().length > 0)
      .map((task) => [task.feature.toLowerCase(), task]),
  )

  const generatedTasks: Task[] = []

  const scopeMilestone = milestones[0]
  generatedTasks.push(
    createTask(project, scopeMilestone.id, {
      title: 'Define concrete success criteria',
      rationale: 'A tight success target prevents scope drift and reduces decision fatigue.',
      definitionOfDone: `One clear statement defines done: ${project.doneDefinition}`,
      estimatedMinutes: 20,
      priority: 'high',
      category: 'scope',
      tags: ['must-have', 'scope'],
    }),
    createTask(project, scopeMilestone.id, {
      title: 'Lock must-have feature shortlist',
      rationale: 'Limits the project to a finite plan with high completion probability.',
      definitionOfDone: `Must-have list capped to ${Math.max(2, mustFeatures.length)} features with short rationale each.`,
      estimatedMinutes: 30,
      priority: 'high',
      category: 'scope',
      tags: ['must-have'],
      source: 'must-have',
    }),
    createTask(project, scopeMilestone.id, {
      title: 'Confirm out-of-scope guardrails',
      rationale: 'Avoids accidental expansion into low-value work.',
      definitionOfDone: 'At least 3 out-of-scope bullets are visible in roadmap header.',
      estimatedMinutes: 20,
      priority: 'medium',
      category: 'scope',
      tags: ['scope-guard'],
    }),
  )

  const setupMilestone =
    milestones.find((milestone) => {
      const normalized = milestone.title.toLowerCase()
      return normalized.includes('setup') || normalized.includes('foundation')
    }) ?? milestones[Math.min(1, milestones.length - 1)]
  generatedTasks.push(
    createTask(project, setupMilestone.id, {
      title: `Setup project foundation for ${projectTypeHint[project.type]}`,
      rationale: 'A stable baseline avoids rework during feature execution.',
      definitionOfDone: 'Routing, shared layout, and persistent state are running locally.',
      estimatedMinutes: 50,
      priority: 'high',
      category: 'setup',
      tags: ['foundation'],
    }),
    createTask(project, setupMilestone.id, {
      title: projectTypeStarterTask[project.type].title,
      rationale: projectTypeStarterTask[project.type].rationale,
      definitionOfDone: projectTypeStarterTask[project.type].definitionOfDone,
      estimatedMinutes: 40,
      priority: 'high',
      category: projectTypeStarterTask[project.type].category,
      tags: ['template-family', project.type],
    }),
    createTask(project, setupMilestone.id, {
      title: 'Create reusable UI primitives',
      rationale: 'Consistency improves readability and lowers cognitive load.',
      definitionOfDone: 'Card, button, tag, progress ring, and stepper are reused across screens.',
      estimatedMinutes: 55,
      priority: 'medium',
      category: 'setup',
      tags: ['ui-system'],
    }),
  )

  if (project.familiarity === 'beginner' || project.familiarity === 'somewhat familiar') {
    generatedTasks.push(
      createTask(project, setupMilestone.id, {
        title: `Create a quick learning spike for ${project.techStack.mostUnfamiliarTech || 'unfamiliar tools'}`,
        rationale: 'Small early learning tasks prevent later blocking confusion.',
        definitionOfDone: 'One page of notes plus one tiny proof-of-concept committed.',
        estimatedMinutes: 35,
        priority: 'medium',
        category: 'research',
        tags: ['learning'],
      }),
    )
  }

  const coreMilestoneIndex = milestones.length >= 4 ? 2 : 1
  const coreMilestone = milestones[coreMilestoneIndex]

  if (mustFeatures.length === 0) {
    generatedTasks.push(
      createTask(project, coreMilestone.id, {
        title: 'Implement primary user flow',
        rationale: 'Even without explicit feature list, project needs one complete value path.',
        definitionOfDone: 'A user can complete the main flow from start to result without dead-ends.',
        estimatedMinutes: 75,
        priority: 'high',
        category: 'build',
        tags: ['must-have'],
      }),
    )
  }

  mustFeatures.forEach((feature, index) => {
    const aiTask = aiByFeature.get(feature.toLowerCase())
    generatedTasks.push(
      createTask(project, coreMilestone.id, {
        title: aiTask?.taskTitle || `Build must-have: ${feature}`,
        rationale:
          aiTask?.rationale ||
          `Implements essential user value for ${feature.toLowerCase()} and keeps scope practical.`,
        definitionOfDone:
          aiTask?.definitionOfDone ||
          `Feature works in core flow with at least one manual test scenario documented.`,
        estimatedMinutes: 55 + index * 10,
        priority: 'high',
        category: 'build',
        tags: ['must-have', feature],
        source: 'must-have',
        createdBy: aiTask ? 'ai' : 'template',
      }),
    )
  })

  const validationMilestone =
    milestones.find((milestone) => {
      const normalized = milestone.title.toLowerCase()
      return (
        normalized.includes('validation') ||
        normalized.includes('polish') ||
        normalized.includes('demo')
      )
    }) ??
    milestones[milestones.length - 2] ??
    milestones[milestones.length - 1]

  if (project.qualityRequirements.performance === 'high') {
    generatedTasks.push(
      createTask(project, validationMilestone.id, {
        title: 'Measure and optimize critical interaction latency',
        rationale: 'High performance requirement needs explicit validation work.',
        definitionOfDone: 'Two slowest interactions are measured and improved with before/after notes.',
        estimatedMinutes: 50,
        priority: 'high',
        category: 'test',
        tags: ['performance'],
        source: 'quality',
      }),
    )
  }

  if (project.qualityRequirements.security === 'high') {
    generatedTasks.push(
      createTask(project, validationMilestone.id, {
        title: 'Run basic security hardening checklist',
        rationale: 'Security concerns should be addressed early and explicitly.',
        definitionOfDone: 'Input validation, dependency audit, and key-risk notes are documented.',
        estimatedMinutes: 45,
        priority: 'high',
        category: 'test',
        tags: ['security'],
        source: 'quality',
      }),
    )
  }

  if (project.qualityRequirements.accessibility !== 'low') {
    generatedTasks.push(
      createTask(project, validationMilestone.id, {
        title: 'Accessibility pass on key screens',
        rationale: 'Accessible interactions reduce cognitive burden for wider users.',
        definitionOfDone: 'Keyboard navigation and visible focus states validated for all primary actions.',
        estimatedMinutes: 35,
        priority: 'medium',
        category: 'test',
        tags: ['accessibility'],
        source: 'quality',
      }),
    )
  }

  generatedTasks.push(
    createTask(project, validationMilestone.id, {
      title: 'Finish integration checks for core flow',
      rationale: 'Prevents broken transitions between key screens before demo.',
      definitionOfDone: 'Full user path tested from creation to dashboard with no blockers.',
      estimatedMinutes: 40,
      priority: 'high',
      category: 'test',
      tags: ['integration'],
    }),
  )

  const deliveryMilestone = milestones[milestones.length - 1]
  niceFeatures.forEach((feature, index) => {
    generatedTasks.push(
      createTask(project, deliveryMilestone.id, {
        title: `Optional polish: ${feature}`,
        rationale: 'Nice-to-have additions are intentionally placed late to protect core scope.',
        definitionOfDone: 'Feature is merged only if must-have path remains stable and usable.',
        estimatedMinutes: 30 + index * 10,
        priority: 'low',
        category: 'polish',
        optional: true,
        tags: ['nice-to-have', feature],
        source: 'nice-to-have',
      }),
    )
  })

  generatedTasks.push(
    createTask(project, deliveryMilestone.id, {
      title: 'Prepare demo script and delivery notes',
      rationale: 'A clear demo sequence improves communication and evaluation quality.',
      definitionOfDone: '5-minute walkthrough script and talking points are saved in docs.',
      estimatedMinutes: 25,
      priority: 'medium',
      category: 'delivery',
      tags: ['demo'],
    }),
  )

  const byMilestone = new Map<string, Task[]>()
  for (const task of generatedTasks) {
    if (!byMilestone.has(task.milestoneId)) {
      byMilestone.set(task.milestoneId, [])
    }

    byMilestone.get(task.milestoneId)?.push(task)
  }

  const cappedTasks: Task[] = []
  milestones.forEach((milestone) => {
    const tasksForMilestone = [...(byMilestone.get(milestone.id) ?? [])]
    while (tasksForMilestone.length < 3) {
      const filler = fillerTemplate(milestone.title, tasksForMilestone.length)
      tasksForMilestone.push(
        createTask(project, milestone.id, {
          title: filler.title,
          rationale: filler.rationale,
          definitionOfDone: filler.definitionOfDone,
          estimatedMinutes: 25 + tasksForMilestone.length * 5,
          priority: 'medium',
          category: filler.category,
          tags: ['filler'],
        }),
      )
    }
    const ordered = connectDependencies(tasksForMilestone).slice(0, caps.maxTasksPerMilestone)
    cappedTasks.push(...ordered)
  })

  return {
    project,
    milestones,
    tasks: cappedTasks,
  }
}
