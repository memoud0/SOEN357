# Momentum Design Rationale

## Hypothesis Alignment
The prototype is built around this hypothesis: students abandon projects less when the interface reduces planning ambiguity, limits visible scope, and pushes immediate action.

Core structure directly mirrors that hypothesis:
1. Wizard: reduce ambiguity through guided scoping
2. Session mode: reduce cognitive load by showing only immediate tasks
3. Dashboard: reinforce continuity through momentum feedback

## Cognitive Overload Reduction Decisions
- Progressive disclosure: one wizard step at a time instead of a single dense form
- Finite roadmap generation: 3-5 milestones with bounded task counts, no infinite backlog
- Scope guard visibility: must-have vs nice-to-have vs out-of-scope always explicit
- Session-first UX: primary CTA starts focused work quickly for returning users
- Workout mode isolation: full roadmap hidden during session to avoid overwhelm

## Why Wizard + Session + Dashboard
- Wizard converts abstract intent into structured planning inputs with low friction
- Roadmap applies template/rule constraints to keep tasks realistic and demo-ready
- Session mode operationalizes momentum by prioritizing top 3 actionable tasks
- Reflection captures blockers and qualitative outcomes for later UX analysis
- Dashboard consolidates completion, streak, session history, and blocker patterns

## HCI-Focused Interaction Choices
- Supportive microcopy and non-judgmental language
- High-contrast dark UI with clear hierarchy and large card-based grouping
- Keyboard-reachable controls and visible focus states
- Subtle motion for transitions and completion feedback without distraction
- Local-first persistence to preserve continuity and reduce setup friction

## Evaluation Readiness
The prototype includes study-oriented instrumentation:
- time-to-first-action (`timeToFirstActionSeconds`)
- completed/skipped tasks per session
- reflection text (what worked, blockers, next step)
- exportable JSON dataset from settings

This enables quantitative + qualitative analysis for course reporting.
