# Implementation Plan: Vyra MVP

**Branch**: `001-vyra-mvp` | **Date**: 2026-09-12 | **Spec**: [spec.md](specs/001-vyra-mvp/spec.md)

**Input**: Feature specification from `specs/001-vyra-mvp/spec.md`

## Summary

Build the MVP of Vyra — a coach-and-client training platform. The MVP enables a trainer to build/publish periodized programs, trainees to view/log workouts with timed rest intervals and PR detection, bodyweight tracking, and a trainer roster with adherence analytics. Technical approach: Next.js 15 App Router with TypeScript, Drizzle ORM on Postgres, Firebase Auth, Tailwind + shadcn/ui themed via Stitch MCP design system.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 24

**Primary Dependencies**: Next.js 16.3 (App Router), React 19, Drizzle ORM, shadcn/ui, Tailwind CSS 4, Recharts (charts), Firebase Auth SDK

**Storage**: PostgreSQL via Cloud SQL + Drizzle ORM; Cloud Storage for future photo uploads

**Testing**: Vitest (unit + integration), Playwright (E2E), React Testing Library (components)

**Target Platform**: Mobile-first PWA (375px primary), Desktop secondary (1024px+)

**Project Type**: Web application (Next.js full-stack with Server Actions)

**Performance Goals**: Today screen load <1s, workout logging <200ms per set, roster load <2s for 50 trainees

**Constraints**: Offline support out of scope for MVP, 50 trainees per trainer max, no AI features in MVP

**Scale/Scope**: 1 trainer × 50 trainees, ~15 screens, ~12 database tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First PWA | ✅ PASS | Primary breakpoint 375px, bottom nav for trainee, responsive trainer console |
| II. Trainer↔Trainee Scope | ✅ PASS | No social features, no marketplace — strict coaching relationship |
| III. Domain Data Model | ✅ PASS | All entities from §4 represented in Drizzle schema |
| IV. Responsible AI | ✅ N/A MVP | AI features deferred to V2; data model includes consent fields for forward compatibility |
| V. Spec-Driven Development | ✅ PASS | Using spec-kit SDD workflow |
| VI. Stitch Design System | ✅ PASS | Design system created (assets/7111496643528512196), all screens via Stitch MCP |
| VII. Test-First | ✅ PASS | Vitest + RTL + Playwright configured; tests per user story |

## Project Structure

### Documentation (this feature)

```text
specs/001-vyra-mvp/
├── spec.md              # Feature specification
├── plan.md              # This file
├── tasks.md             # Task breakdown (by /speckit.tasks)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth group (login, register, onboarding)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── onboard/page.tsx
│   ├── (trainee)/                # Trainee role group
│   │   ├── today/page.tsx        # Today screen (P1)
│   │   ├── program/page.tsx      # Program calendar (P3)
│   │   ├── session/page.tsx      # Workout logging (P1)
│   │   ├── progress/page.tsx     # Bodyweight chart (P2)
│   │   └── layout.tsx            # Trainee layout (bottom nav)
│   ├── (trainer)/                # Trainer role group
│   │   ├── roster/page.tsx       # Trainer roster (P2)
│   │   ├── trainee/[id]/page.tsx # Trainee detail (P2)
│   │   ├── program/
│   │   │   ├── new/page.tsx      # Program builder (P1)
│   │   │   └── [id]/page.tsx     # Program editor
│   │   └── layout.tsx            # Trainer layout (sidebar nav)
│   ├── api/                      # API routes (if needed beyond Server Actions)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing / role redirect
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui primitives (Stitch-themed)
│   ├── workout/                  # Workout-specific components
│   ├── program/                  # Program builder components
│   └── charts/                   # Chart components
├── db/                           # Database layer
│   ├── schema/                   # Drizzle schemas
│   │   ├── users.ts
│   │   ├── programs.ts
│   │   ├── exercises.ts
│   │   ├── sessions.ts
│   │   └── metrics.ts
│   ├── migrations/               # Drizzle migrations
│   ├── seed/                     # Seed data (exercises)
│   ├── index.ts                  # DB connection
│   └── drizzle.config.ts         # Drizzle config
├── lib/                          # Shared utilities
│   ├── auth/                     # Firebase Auth helpers
│   ├── actions/                  # Server Actions
│   │   ├── program.ts
│   │   ├── session.ts
│   │   ├── metrics.ts
│   │   └── roster.ts
│   ├── utils.ts                  # General utilities
│   ├── types.ts                  # Shared TypeScript types
│   └── constants.ts              # App constants
├── hooks/                        # Custom React hooks
│   ├── use-rest-timer.ts
│   ├── use-session.ts
│   └── use-program-day.ts
└── styles/                       # Design tokens from Stitch
    └── tokens.ts                 # Stitch design token exports

tests/
├── unit/                         # Unit tests (Vitest)
│   ├── db/                       # Schema and query tests
│   ├── lib/                      # Utility and action tests
│   └── hooks/                    # Hook tests
├── integration/                  # Integration tests (Vitest)
│   ├── program-crud.test.ts
│   ├── session-logging.test.ts
│   └── roster-queries.test.ts
└── e2e/                          # E2E tests (Playwright)
    ├── trainer-flow.spec.ts
    └── trainee-flow.spec.ts
```

**Structure Decision**: Single Next.js full-stack application using App Router route groups for role-scoped layouts. Server Actions for data mutations, eliminating the need for a separate API layer. Drizzle ORM schemas co-located in `src/db/schema/` for tight coupling with the domain model.

## Data Model

### Core Entities (Drizzle Schema)

| Table | Key Fields | Relationships |
|-------|-----------|---------------|
| `users` | id, role, name, dob, sex, heightCm, injuries[], goals[] | Has many TrainerLinks, Programs, Sessions |
| `trainer_links` | trainerId, traineeId, status | Belongs to User × 2 |
| `programs` | id, trainerId, traineeId, title, startDate, endDate, status, version, parentVersionId | Has many ProgramWeeks |
| `program_weeks` | id, programId, weekIndex | Has many ProgramDays |
| `program_days` | id, weekId, dayOfWeek, label, isRestDay | Has many Blocks |
| `blocks` | id, dayId, order, type (straight/superset/circuit) | Has many ExercisePrescriptions |
| `exercise_prescriptions` | id, blockId, exerciseId, sets, repRangeLow, repRangeHigh, rirScheme[], restSeconds, loadGuidance, formCueText, videoUrl, targetMuscleGroups[] | Belongs to Block + Exercise |
| `exercises` | id, name, primaryMuscle, secondaryMuscles[], equipment, videoUrl, wikiUrl | Library entity |
| `workout_sessions` | id, traineeId, programDayId, date, startedAt, endedAt, notes | Has many SetLogs |
| `set_logs` | id, sessionId, exercisePrescriptionId, setIndex, reps, weightKg, rirAchieved, isPR | Belongs to WorkoutSession |
| `body_metric_entries` | id, traineeId, date, weightKg, source | Belongs to User |

### Key Queries

1. **Today resolution**: `SELECT pd.* FROM program_days pd JOIN program_weeks pw ON pd.weekId = pw.id JOIN programs p ON pw.programId = p.id WHERE p.traineeId = $1 AND p.status = 'published' AND compute_day_index(p.startDate, NOW()) = day_index(pw.weekIndex, pd.dayOfWeek)`
2. **PR detection**: `SELECT MAX(weightKg * reps) FROM set_logs sl JOIN exercise_prescriptions ep ON sl.exercisePrescriptionId = ep.id WHERE ep.exerciseId = $1 AND session.traineeId = $2`
3. **Adherence %**: `COUNT(sessions WHERE date >= program.startDate) / COUNT(non-rest-days WHERE date <= NOW())`
4. **Roster alerts**: Subquery for trainees with 3+ consecutive missed days or flat load progression over 2+ weeks

## Complexity Tracking

No constitution violations. Complexity is appropriate for the domain:
- 11 tables is expected for a periodization-aware training platform
- The Program→Week→Day→Block→Prescription hierarchy is essential, not over-engineered
- Server Actions keep the architecture simple (no separate API service)
