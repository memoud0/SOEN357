# Momentum Prototype

Momentum is a local-first, single-page HCI/UI/UX prototype for helping students move from vague coding ideas to concrete progress.

## Why this prototype exists
Many early-stage developers abandon projects because blank planning tools create decision overload. Momentum tests a different flow:
1. Guided scoping wizard
2. Finite roadmap generation
3. 45-minute session mode with only next tasks visible
4. Reflection + momentum dashboard

The goal is usability and follow-through, not backend complexity.

## Tech stack
- Vite
- React + TypeScript
- Tailwind CSS (v4)
- React Router
- Lucide React icons
- Framer Motion
- localStorage persistence (no backend)

## Setup
1. Install dependencies:
```bash
npm install
```
2. Optional AI enhancement config (fallback is always available without token):
Copy `.env.example` to `.env` and set your key:
```bash
cp .env.example .env
VITE_OPENROUTER_API_KEY=your_key_here
VITE_AI_MODEL=google/gemini-2.0-flash-exp:free
```
If no key is present, roadmap generation uses template + rules only.

## Run locally
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Routes
- `/` Home / Project Hub
- `/wizard` Guided scoping wizard
- `/roadmap/:projectId` Roadmap overview + editing
- `/session/:projectId` Session prep + workout mode + reflection
- `/dashboard/:projectId` Momentum dashboard
- `/settings` Data controls / export / reset

## Local data storage
- Data is persisted in `localStorage`
- Storage key: `momentum.v1`
- Includes projects, milestones, tasks, sessions, and reflection logs

## Study mode instrumentation
Session tracking includes:
- `startedAt`
- `firstActionAt`
- `timeToFirstActionSeconds`
- `completedTaskIds`
- `skippedTaskIds`
- notes + reflection

This is designed for HCI evaluation metrics like time-to-first-action and completion momentum.

## Export research data
1. Open `/settings`
2. Click **Export JSON**
3. A timestamped JSON file is downloaded with all local prototype data

## Edit sample/demo scenarios
Seed/demo data lives in:
- `src/data/defaults.ts`

You can edit:
- `demoProject`
- `demoMilestones`
- `demoTasks`
- `demoSessions`

Realistic demo walkthroughs for presentations and report screenshots.

## Key architecture modules
- Roadmap generation: `src/features/roadmap/generator.ts`
- Session recommendation logic: `src/features/session/recommendation.ts`
- Persistence: `src/lib/storage.ts`
- Global state/actions: `src/app/store.tsx`
