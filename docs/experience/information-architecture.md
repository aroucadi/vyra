# VYRA Autonomous Biomechanical Engine — Information Architecture & Navigation

## 1. Top-Level Shell & The 4 Navigation Tabs

The trainee experience is anchored by a persistent 4-tab bottom navigation bar (`TraineeNav.tsx`), engineered for mobile web and standalone PWA environments:

```
[ Today ]          [ Program ]          [ Exercises ]          [ You ]
/today             /program             /exercises             /you
Temporal anchor    16-week blueprint    6,554 OpenGym index    Progress & settings
```

### Core Navigation Rules & Invariants:
1. **No Separate "Log Session" Tab**: Active session execution is initiated directly when the trainee taps **Start Workout** on the Today hero card, or selects an exercise block from `/program`.
2. **Dedicated Top-Level Program Tab (`/program`)**: The 16-week periodized mesocycle blueprint, week strip calendar, and scheduled training days are first-class citizens accessible at `/program`.
3. **Canonical Exercise Catalogue (`/exercises`)**: The complete 6,554-exercise OpenGym catalogue is housed at `/exercises`. The legacy path `/library` is preserved via a permanent HTTP 308 redirect (`permanentRedirect('/exercises')`).
4. **Full-Screen Immersive Gym Floor (`/session`)**: When entering an active workout, the bottom navigation bar is automatically unmounted (`if (pathname.startsWith('/session')) return null;`) to eliminate accidental navigation during heavy lifts. A prominent, high-contrast "Exit Session" control is pinned to the header.
5. **Contextual AI Coach Concierge (`/coach`)**: AI coaching is accessible via contextual smart chips (e.g. `[Swap Exercise]`, `[Short on Time]`, `[Why this weight?]`) and header links, rather than occupying a permanent bottom tab.
6. **Buried Developer Tools & Role Switcher**: The role switcher and developer settings are completely removed from public UI and secured behind a 5-tap gesture on the version string in `/you`.

---

## 2. Complete Next.js Route Directory (24 Compiled Routes)

The production application compiles 24 verified Next.js routes across trainee experiences, trainer portals, authentication, and backend API handlers:

### 2.1 Trainee Pages (12 Routes)
| Route | Component / Path | Description | Access Pattern |
|:---|:---|:---|:---|
| `/` | `src/app/page.tsx` | Root entry point; dynamically redirects to `/today` or onboarding. | Direct / PWA launch |
| `/today` | `src/app/(trainee)/today/page.tsx` | Primary temporal anchor: readiness check-in, hero workout card, supplement stack drawer, and collapsed timeline. | Primary Tab 1 |
| `/session` | `src/app/(trainee)/session/page.tsx` | Full-screen active gym floor: 1-exercise focus, plate calculator popover, audio rest timer, tension spotlight, substitution drawer. | Start Workout trigger |
| `/program` | `src/app/(trainee)/program/page.tsx` | 16-week periodized program blueprint, weekly volume strip, and day-by-day workout details. | Primary Tab 2 |
| `/exercises` | `src/app/(trainee)/exercises/page.tsx` | Canonical 6,554 OpenGym catalogue browser with <10ms inverted token search, 40+ shorthands, and detail sheet. | Primary Tab 3 |
| `/library` | `src/app/(trainee)/library/page.tsx` | Legacy route forwarder: executes permanent HTTP 308 redirect directly to `/exercises`. | Bookmark / Legacy URL |
| `/posture` | `src/app/(trainee)/posture/page.tsx` | Postural symmetry dashboard: Poliquin/Thibaudeau/ATG `<StructuralBalanceRadar />`, joint risk diagnosis, corrective protocols. | You / Direct |
| `/progress` | `src/app/(trainee)/progress/page.tsx` | Longitudinal analytics: volume load curves, estimated 1RM trends, PR history registry. | You / Direct |
| `/profile` | `src/app/(trainee)/profile/page.tsx` | Anthropometric profile, personal lifting records, body mass telemetry. | You / Direct |
| `/you` | `src/app/(trainee)/you/page.tsx` | Account management, unit preferences (kg/lb), offline cache status, hidden 5-tap developer menu. | Primary Tab 4 |
| `/your-data` | `src/app/(trainee)/your-data/page.tsx` | Client-side privacy controls: JSON data export, IndexedDB draft status, local database reset. | Settings link |
| `/install` | `src/app/(trainee)/install/page.tsx` | Zero-friction PWA standalone installation walkthrough for iOS Safari and Android Chrome. | Direct / Header prompt |

### 2.2 Trainer & Admin Pages (4 Routes)
| Route | Component / Path | Description | Access Pattern |
|:---|:---|:---|:---|
| `/roster` | `src/app/(trainer)/roster/page.tsx` | Multi-client athlete management dashboard displaying compliance, adherence, and active program states. | Trainer Shell |
| `/program/new` | `src/app/(trainer)/program/new/page.tsx` | Agentic RAG program generator draft builder with deterministic constraint filtering. | Trainer Action |
| `/program/[id]` | `src/app/(trainer)/program/[id]/page.tsx` | Interactive mesocycle editor: drag-and-drop exercise slotting, rep ranges, progression rules. | Trainer Action |
| `/trainee/[id]` | `src/app/(trainer)/trainee/[id]/page.tsx` | Individual trainee deep-dive: workout history, biometrics, joint risk flags, session debriefs. | Roster Selection |

### 2.3 Authentication Page (1 Route)
| Route | Component / Path | Description | Access Pattern |
|:---|:---|:---|:---|
| `/login` | `src/app/login/page.tsx` | High-security, role-aware authentication page with passkey/session token support. | Auth Guard |

### 2.4 API Route Handlers (6 Routes)
| Route | Handler / Path | Method | Functionality |
|:---|:---|:---|:---|
| `/api/events` | `src/app/api/events/route.ts` | `POST` | High-throughput telemetry event ingestion with zero-PII scrubbing. |
| `/api/exercises` | `src/app/api/exercises/route.ts` | `GET` | Sub-50ms query & filter engine for the 6,554-exercise OpenGym database. |
| `/api/health` | `src/app/api/health/route.ts` | `GET` | Multi-region Cloud Run health probe (`status: "healthy"`, timestamp, commit SHA). |
| `/api/posture` | `src/app/api/posture/route.ts` | `GET`, `POST` | Computes Poliquin and Thibaudeau structural balance ratios against benchmark lifts. |
| `/api/substitutions` | `src/app/api/substitutions/route.ts` | `POST` | Biomechanical vector and resistance curve matching for equipment substitutions. |
| `/api/webhooks/biometrics` | `src/app/api/webhooks/biometrics/route.ts` | `POST` | Ingests passive Apple HealthKit, Whoop, and Oura biometric payloads with HMAC validation. |

---

## 3. Screen Hierarchy & Experience Flows

```
Today (/today) — Primary Temporal Anchor
  ├── Header: Current Date + Biometric Readiness Pill
  ├── Readiness Checkin (1-tap sleep & HRV confirmation)
  ├── Cross-Pillar Insight Card (e.g. HRV down-regulation with [Adjust Session] trigger)
  ├── Hero Workout Card (Primary Dominant CTA: [Start Workout])
  │     └── Tapping [Start Workout] ──> Enters /session (Active Gym Floor)
  │                                       ├── Micro-Torso Tension Spotlight (SVG anterior/posterior)
  │                                       ├── Setup Anchor & Kinetic Drive typography
  │                                       ├── Plate Calculator Popover (Olympic/Smith loading)
  │                                       ├── Stepper Set Logger (Weight, Reps, RIR)
  │                                       ├── Rest Interval Bar (Progress countdown + Web Audio chime)
  │                                       ├── Substitution Copilot Drawer (Equipment matrix swap)
  │                                       └── Finish Session ──> Session Summary (PR celebration)
  ├── Supplement Stack Drawer (Morning / Workout / Evening checklist)
  └── Collapsed Timeline (Past completed moments & quiet upcoming rows)

Program (/program) — Mesocycle Architecture
  ├── 16-Week Mesocycle Header & Tonnage Trends
  ├── Interactive 7-Day Week Strip
  └── Daily Workout Breakdown (Exercise blocks, target sets, rep ranges, progression rules)

Exercises (/exercises) — Biomechanical Knowledge Base
  ├── Search Bar (<10ms inverted token search, 40+ shorthands: db, rdl, ohp, bb)
  ├── Combinatorial Filters (24 muscle groups, 18 equipment modalities)
  └── Exercise Grid & Slide-up Detail Sheet (<ExerciseDetailSheet />)
        ├── <AnatomicalTensionSpotlight />
        ├── Equipment & Setup Requirements
        ├── Step-by-Step Execution Instructions
        └── Direct Alternative Substitutions

You (/you) — Athlete Dashboard & Controls
  ├── Anthropometric Profile & PR Records
  ├── Postural Architecture Radar Link (/posture)
  ├── Longitudinal Progress Analytics (/progress)
  ├── Units (Metric kg / Imperial lb) & Offline Cache Status
  └── Hidden Developer Menu (Activated via 5-tap sequence on version string)
```

---

## 4. UI Primitives: Composable Blocks & Live Biomechanical Components

Every interface in Vyra is built strictly upon five composable compound primitives and four specialized biomechanical components:

### 4.1 Composable Compound Primitives
1. **`Card`** (`Card.Glance`, `Card.Action`, `Card.Learn`): Strict 3-element vertical ceiling (Category/Eyebrow $\to$ Hero Content $\to$ Action).
2. **`Checkin`**: 1-tap state confirmation with pre-filled smart defaults (Readiness, Hydration, Supplement doses).
3. **`Log`**: Numeric stepper input (`-`, `+`) with `tabular-nums` formatting and pre-filled previous session records.
4. **`Insight`**: Single-sentence cross-domain observation with contextual action trigger (maximum 1 visible per viewport).
5. **`Plan`**: Chronological moment sequence (Today's vertical timeline or Program's 7-day strip).

### 4.2 Specialized Biomechanical Primitives
1. **`<AnatomicalTensionSpotlight />`**: Interactive vector SVG micro-torso highlighting target muscles in Emerald (`#10B981`), synergists in Cyan (`#06B6D4`), and neutral tissue in Slate (`#334155`). Features an anterior/posterior segmented toggle and zero WebGL latency.
2. **`<SubstitutionCopilotDrawer />`**: Slide-up sheet matching exercises across an equipment matrix (Barbell, Dumbbell, Cable, Machine, Bodyweight) with biomechanical regression rationale and 1-tap active workout swap.
3. **`<PlateCalculatorPopover />`**: Visual barbell plate breakdown supporting Olympic 20kg, Women's 15kg, and Smith machines (0–15kg) with exact per-side disk combinations.
4. **`<RestIntervalBar />`**: Live progress countdown bar backed by synthetic Web Audio oscillator pips (`sound.ts`) and Screen Wake Lock persistence (`wakelock.ts`).

---

## 5. Domain Models & Type Contracts

The information architecture is governed by typed models defined across `src/lib/types/`:

```typescript
export interface Exercise {
  id: string; // Zero-padded 4-digit ID
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  setupAnchor?: string;
  kineticDrive?: string;
  femaleVariantId?: string;
}

export interface SetLog {
  id: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir?: number;
  isPR?: boolean;
  completedAt: string;
}

export interface Session {
  id: string;
  programId: string;
  dayIndex: number;
  title: string;
  startTime: string;
  endTime?: string;
  status: "pending" | "in_progress" | "completed";
  completedSets: SetLog[];
}

export interface ProgressionRule {
  policy: "double" | "triple" | "greyskull" | "linear" | "off";
  repFloor: number;
  repCeiling: number;
  weightIncrementKg: number;
  stallStreak: number;
  deloadThreshold: number; // Defaults to 3 stalls
}
```
