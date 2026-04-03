import { LoaderCircle, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../app/store'
import { Card } from '../components/ui/Card'
import { Stepper } from '../components/ui/Stepper'
import { TagInput } from '../components/ui/TagInput'
import type { Importance, WizardDraft } from '../types/models'

const stepLabels = ['Basics', 'Scope', 'Stack', 'Quality', 'Work style', 'Review']

const projectTypeOptions: WizardDraft['projectBasics']['projectType'][] = [
  'web app',
  'mobile app',
  'desktop app',
  'API/backend service',
  'data/ML tool',
  'browser extension',
  'other',
]

const complexityOptions: WizardDraft['scopeTimeline']['complexity'][] = ['tiny', 'small', 'medium']
const timelineOptions: WizardDraft['scopeTimeline']['timeline'][] = [
  'weekend',
  '1-2 weeks',
  '1 month',
  '2+ months',
]

const familiarityOptions: WizardDraft['techFamiliarity']['familiarity'][] = [
  'beginner',
  'somewhat familiar',
  'comfortable',
  'advanced',
]

const granularityOptions: WizardDraft['workStyle']['taskGranularity'][] = [
  'small bites',
  'balanced',
  'bigger chunks',
]

const abandonmentOptions = [
  'unclear next steps',
  'too many choices',
  'perfectionism',
  'unfamiliar tech',
  'poor motivation',
  'time pressure',
  'context switching',
  'other',
]

function ToggleGroup<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: T[]
  selected: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-xl border px-3 py-2 text-sm transition ${
            selected === option
              ? 'border-brand-500 bg-brand-950/40 text-brand-200'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function ImportancePicker({
  value,
  onChange,
  label,
}: {
  value: Importance
  onChange: (next: Importance) => void
  label: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-200">{label}</p>
      <ToggleGroup options={['low', 'medium', 'high']} selected={value} onChange={onChange} />
    </div>
  )
}

export function WizardRoute() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const { state, updateWizardSection, createProjectFromWizard, resetWizardDraft } = useAppStore()

  const draft = state.wizardDraft

  const canProceed = useMemo(() => {
    if (step === 0) {
      return draft.projectBasics.projectTitle.trim().length > 1
    }

    return true
  }, [draft.projectBasics.projectTitle, step])

  const next = () => setStep((current) => Math.min(current + 1, stepLabels.length - 1))
  const back = () => setStep((current) => Math.max(current - 1, 0))

  const generateRoadmap = async () => {
    setIsGenerating(true)
    try {
      const projectId = await createProjectFromWizard(draft)
      navigate(`/roadmap/${projectId}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Guided Scoping Wizard</h1>
            <p className="text-sm text-slate-300">
              Let&apos;s turn your idea into a realistic first plan with low decision fatigue.
            </p>
          </div>
          <button
            type="button"
            onClick={resetWizardDraft}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800"
          >
            Reset draft
          </button>
        </div>
        <Stepper labels={stepLabels} activeStep={step} />
      </Card>

      <Card className="space-y-4">
        {step === 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Project Basics</h2>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-200">Project title</span>
              <input
                value={draft.projectBasics.projectTitle}
                onChange={(event) =>
                  updateWizardSection('projectBasics', { projectTitle: event.target.value })
                }
                placeholder="Example: AI Meal Planner"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            </label>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-200">One-sentence idea</span>
              <textarea
                value={draft.projectBasics.oneSentenceIdea}
                onChange={(event) =>
                  updateWizardSection('projectBasics', { oneSentenceIdea: event.target.value })
                }
                placeholder="A focused tool that helps..."
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            </label>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-200">Target users</span>
              <input
                value={draft.projectBasics.targetUsers}
                onChange={(event) =>
                  updateWizardSection('projectBasics', { targetUsers: event.target.value })
                }
                placeholder="Who is this for?"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            </label>
            <div className="space-y-1">
              <p className="text-sm text-slate-200">Project type</p>
              <ToggleGroup
                options={projectTypeOptions}
                selected={draft.projectBasics.projectType}
                onChange={(projectType) => updateWizardSection('projectBasics', { projectType })}
              />
            </div>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-200">Why this project matters</span>
              <textarea
                value={draft.projectBasics.motivation}
                onChange={(event) =>
                  updateWizardSection('projectBasics', { motivation: event.target.value })
                }
                placeholder="What motivates you to finish this project?"
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Scope & Timeline</h2>
            <div className="space-y-1">
              <p className="text-sm text-slate-200">Complexity target</p>
              <ToggleGroup
                options={complexityOptions}
                selected={draft.scopeTimeline.complexity}
                onChange={(complexity) => updateWizardSection('scopeTimeline', { complexity })}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-200">Timeline target</p>
              <ToggleGroup
                options={timelineOptions}
                selected={draft.scopeTimeline.timeline}
                onChange={(timeline) => updateWizardSection('scopeTimeline', { timeline })}
              />
            </div>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-200">Hours per week</span>
              <input
                type="number"
                min={1}
                max={40}
                value={draft.scopeTimeline.hoursPerWeek}
                onChange={(event) =>
                  updateWizardSection('scopeTimeline', {
                    hoursPerWeek: Math.max(1, Number(event.target.value) || 1),
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            </label>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-200">What counts as done?</span>
              <textarea
                value={draft.scopeTimeline.doneDefinition}
                onChange={(event) =>
                  updateWizardSection('scopeTimeline', {
                    doneDefinition: event.target.value,
                  })
                }
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            </label>
            <TagInput
              label="Must-have features"
              values={draft.scopeTimeline.mustHaveFeatures}
              onChange={(mustHaveFeatures) => updateWizardSection('scopeTimeline', { mustHaveFeatures })}
              placeholder="Add critical feature"
              helper="Keep this finite. 3-5 is ideal."
            />
            <TagInput
              label="Nice-to-have features"
              values={draft.scopeTimeline.niceToHaveFeatures}
              onChange={(niceToHaveFeatures) =>
                updateWizardSection('scopeTimeline', { niceToHaveFeatures })
              }
              placeholder="Add optional polish"
            />
            <TagInput
              label="Out of scope"
              values={draft.scopeTimeline.outOfScope}
              onChange={(outOfScope) => updateWizardSection('scopeTimeline', { outOfScope })}
              placeholder="Add a boundary"
              helper="Out-of-scope items will be excluded from core milestones."
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Tech Stack & Familiarity</h2>
            <TagInput
              label="Frontend technologies"
              values={draft.techFamiliarity.frontendTech}
              onChange={(frontendTech) => updateWizardSection('techFamiliarity', { frontendTech })}
              placeholder="React, Vue, etc."
            />
            <TagInput
              label="Backend technologies"
              values={draft.techFamiliarity.backendTech}
              onChange={(backendTech) => updateWizardSection('techFamiliarity', { backendTech })}
              placeholder="Node, Spring, etc."
            />
            <TagInput
              label="Database technologies"
              values={draft.techFamiliarity.databaseTech}
              onChange={(databaseTech) => updateWizardSection('techFamiliarity', { databaseTech })}
              placeholder="Postgres, Firebase, etc."
            />
            <TagInput
              label="APIs / integrations"
              values={draft.techFamiliarity.apisIntegrations}
              onChange={(apisIntegrations) =>
                updateWizardSection('techFamiliarity', { apisIntegrations })
              }
              placeholder="Stripe, OpenAI, etc."
            />
            <div className="space-y-1">
              <p className="text-sm text-slate-200">Current familiarity</p>
              <ToggleGroup
                options={familiarityOptions}
                selected={draft.techFamiliarity.familiarity}
                onChange={(familiarity) => updateWizardSection('techFamiliarity', { familiarity })}
              />
            </div>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-200">Most unfamiliar technology</span>
              <input
                value={draft.techFamiliarity.mostUnfamiliarTech}
                onChange={(event) =>
                  updateWizardSection('techFamiliarity', {
                    mostUnfamiliarTech: event.target.value,
                  })
                }
                placeholder="Example: GraphQL"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Constraints & Quality</h2>
            <TagInput
              label="Main constraints"
              values={draft.constraintsQuality.constraints}
              onChange={(constraints) => updateWizardSection('constraintsQuality', { constraints })}
              placeholder="No backend, 4 week deadline..."
            />
            <ImportancePicker
              value={draft.constraintsQuality.performanceImportance}
              onChange={(performanceImportance) =>
                updateWizardSection('constraintsQuality', { performanceImportance })
              }
              label="Performance importance"
            />
            <ImportancePicker
              value={draft.constraintsQuality.securityImportance}
              onChange={(securityImportance) =>
                updateWizardSection('constraintsQuality', { securityImportance })
              }
              label="Security importance"
            />
            <ImportancePicker
              value={draft.constraintsQuality.accessibilityImportance}
              onChange={(accessibilityImportance) =>
                updateWizardSection('constraintsQuality', { accessibilityImportance })
              }
              label="Accessibility importance"
            />
            <TagInput
              label="Time complexity concerns"
              values={draft.constraintsQuality.timeComplexityConcerns}
              onChange={(timeComplexityConcerns) =>
                updateWizardSection('constraintsQuality', { timeComplexityConcerns })
              }
              placeholder="n^2 operations, sorting..."
            />
            <TagInput
              label="Space complexity concerns"
              values={draft.constraintsQuality.spaceComplexityConcerns}
              onChange={(spaceComplexityConcerns) =>
                updateWizardSection('constraintsQuality', { spaceComplexityConcerns })
              }
              placeholder="memory growth, caching..."
            />
            <TagInput
              label="Known risks / blockers"
              values={draft.constraintsQuality.knownRisks}
              onChange={(knownRisks) => updateWizardSection('constraintsQuality', { knownRisks })}
              placeholder="scope creep, unfamiliar API..."
            />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Work Style</h2>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-200">Preferred session length (minutes)</span>
              <input
                type="number"
                min={15}
                max={90}
                value={draft.workStyle.preferredSessionLength}
                onChange={(event) =>
                  updateWizardSection('workStyle', {
                    preferredSessionLength: Math.max(15, Number(event.target.value) || 45),
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            </label>
            <div className="space-y-1">
              <p className="text-sm text-slate-200">Task granularity</p>
              <ToggleGroup
                options={granularityOptions}
                selected={draft.workStyle.taskGranularity}
                onChange={(taskGranularity) => updateWizardSection('workStyle', { taskGranularity })}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">What usually causes abandonment?</p>
              <div className="flex flex-wrap gap-2">
                {abandonmentOptions.map((option) => {
                  const isSelected = draft.workStyle.abandonmentTriggers.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const next = isSelected
                          ? draft.workStyle.abandonmentTriggers.filter((item) => item !== option)
                          : [...draft.workStyle.abandonmentTriggers, option]

                        updateWizardSection('workStyle', { abandonmentTriggers: next })
                      }}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Review & Generate</h2>
            <p className="text-sm text-slate-300">
              Good momentum. This is enough structure for a realistic roadmap. You can edit tasks
              after generation.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs uppercase text-slate-400">Project</p>
                <p className="mt-1 text-sm text-slate-100">
                  {draft.projectBasics.projectTitle || 'Untitled project'}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {draft.projectBasics.oneSentenceIdea || 'No idea summary yet.'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs uppercase text-slate-400">Scope guard</p>
                <p className="mt-1 text-sm text-slate-100">
                  Must-have: {draft.scopeTimeline.mustHaveFeatures.length} | Nice-to-have:{' '}
                  {draft.scopeTimeline.niceToHaveFeatures.length}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Out of scope: {draft.scopeTimeline.outOfScope.join(', ') || 'None declared'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs uppercase text-slate-400">Timeline</p>
                <p className="mt-1 text-sm text-slate-100">
                  {draft.scopeTimeline.timeline} · {draft.scopeTimeline.hoursPerWeek}h/week
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Complexity: {draft.scopeTimeline.complexity}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs uppercase text-slate-400">Quality priorities</p>
                <p className="mt-1 text-sm text-slate-100">
                  Perf {draft.constraintsQuality.performanceImportance} · Sec{' '}
                  {draft.constraintsQuality.securityImportance} · A11y{' '}
                  {draft.constraintsQuality.accessibilityImportance}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Risks: {draft.constraintsQuality.knownRisks.join(', ') || 'None listed'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={generateRoadmap}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate roadmap
            </button>
            <p className="text-xs text-slate-400">
              Optional AI enhancement activates when `VITE_OPENROUTER_API_KEY` is provided;
              otherwise template logic is used.
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
          >
            Back
          </button>
          {step < stepLabels.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canProceed}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-40"
            >
              Next
            </button>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
