<!-- Sync Impact Report
  Version change: 0.0.0 → 1.0.0
  Added sections: All (initial constitution)
  Modified principles: N/A (initial)
  Removed sections: N/A
  Follow-up TODOs: None
-->

# NewME Constitution

## Core Principles

### I. Mobile-First PWA — Phone-in-the-Gym-Bag Product
NewME MUST be built as a mobile-first, installable Progressive Web App. The trainee
experience is designed for a phone in a gym bag — not a desktop dashboard. Desktop is
the trainer's secondary surface for program building. All UI decisions MUST prioritize
touch targets, thumb-zone CTAs, and sub-60-second logging flows. Breakpoints: 375px
(mobile, primary), 768px (tablet), 1024px (desktop), 1440px (wide).

### II. Trainer↔Trainee Relationship Architecture
The application MUST be scoped strictly to the trainer-to-trainee coaching relationship.
No public exercise marketplace, no social feed, no standalone habit app. A single account
can hold both roles (trainer and trainee), but the UI MUST be role-scoped — the user lands
on the correct home screen based on active context, not a toggle buried in settings. The
trainer is the authority on programming; AI assists but never auto-publishes.

### III. Domain Data Model Integrity
All training concepts (programs, weeks, days, blocks, exercise prescriptions, RIR schemes,
superset/circuit grouping, meal plans) MUST be represented as structured data — not hardcoded
logic. The trainer's programming document becomes the first seeded Program template, not a
special case in the engine. Postgres (Cloud SQL + Drizzle ORM) is the primary data store.
Every entity relationship from §4 of the product spec MUST be maintained.

### IV. Responsible AI & Privacy Guardrails (NON-NEGOTIABLE)
- Progress photos MUST undergo mandatory face-crop before upload — enforced client-side
  AND server-side (reject uploads with detectable face boxes).
- AI photo analysis MUST be framed as training feedback, never medical/body-image judgment.
- Nutrition targets are trainer-set ranges — the app MUST NOT auto-generate aggressive deficits.
- AI copy MUST avoid appearance-judgment language; weight tracking is optional per trainee.
- 18+ age gate on physique-photo AI analysis.
- Per-submission consent (`consentAiAnalysis`) required; trainees can disable entirely.
- Photos use signed URLs with short TTL, never public buckets.
- Soft-delete with 30-day purge lifecycle.

### V. Spec-Driven Development (SDD)
All features MUST follow the Spec Kit workflow: Constitution → Specify → Plan → Tasks →
Implement → Converge. No code is written without a corresponding spec. Implementation is
verified against specs through `/speckit-converge` until convergence is achieved. Specs are
the source of truth; code implements specs, not the reverse.

### VI. Design System — Stitch as Source of Truth
All UI screens MUST be designed using the Stitch MCP design system (`assets/7111496643528512196`).
Shadcn/ui is used for component structure only — tokens (color, type, spacing, motion) come
from Stitch. The app MUST NOT default to stock shadcn zinc/slate palette or Inter-everywhere
type stack. Data-dense screens (roster, program builder, charts) MUST look like a professional
coaching tool — structured tables, sparklines, confident type hierarchy — not a wellness-app
pastel dashboard.

### VII. Test-First & Complete Coverage
Tests are written before implementation (Red-Green-Refactor). Every domain entity, API route,
and user flow MUST have corresponding tests. Edge cases are not deferred — with AI-assisted
development, the marginal cost of completeness is near-zero (gStack Boil the Lake principle).
Test coverage is verified before convergence.

## Technology Stack Constraints

- **Frontend**: Next.js (App Router) + TypeScript, deployed as container to Cloud Run
- **Styling**: Tailwind CSS + shadcn/ui (structure) + Stitch MCP tokens (design)
- **Database**: Cloud SQL (Postgres) + Drizzle ORM
- **Auth**: Firebase Auth / Identity Platform (email/passkey)
- **Storage**: Cloud Storage (signed URLs, lifecycle rules)
- **AI**: Vertex AI / Gemini API (gemini-3.8-flash) — V2 only
- **AI SDK**: Vercel AI SDK (`ai` package, `useChat`/`streamText`) — V2 only
- **Design**: Stitch MCP for all screen generation and design token extraction
- **CDN**: Cloud CDN for static assets and exercise videos
- **Accessibility**: WCAG AA contrast minimum, full keyboard nav on trainer console

## Development Workflow

- **gStack Sprint Workflow**: Think → Plan → Build → Review → Test → Ship → Deploy → Reflect
- **Spec Kit SDD**: Constitution → Specify → Plan → Tasks → Implement → Converge
- **Build Phases**: MVP (manual program builder + logging) → V1 (charts + photos) → V2 (AI features)
- **Code Review**: `/review` (gStack Staff Engineer) before merge
- **QA**: `/qa` (gStack QA Lead) for browser testing
- **Security**: `/cso` (gStack CSO) for OWASP/STRIDE audit before V2 (AI features)
- **Ship**: `/ship` (gStack Release Engineer) for deployment

## Governance

This constitution supersedes all other development practices for the NewME project. All
code changes MUST verify compliance with these principles. Amendments require documentation
of rationale and version increment. The product specification (gstack.md)
is the authoritative feature reference; this constitution governs how those features are built.

**Version**: 1.0.0 | **Ratified**: 2026-09-12 | **Last Amended**: 2026-09-12
