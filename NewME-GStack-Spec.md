\# NewME — Product Specification for GStack / Antigravity CLI



This doc is written to be pasted straight into Antigravity CLI (or Antigravity IDE) once GStack

is installed on the project, so `/spec` has a real brief to work from instead of a one-line idea.

A few things below are explicit \*\*assumptions\*\* — flag them for the trainer-side product owner

(you) to confirm before the CLI generates the executable spec.



\---



\## 0. Bootstrapping in Antigravity + GStack



```bash

\# 1) create the project folder

mkdir NewME \&\& cd NewME

git init



\# 2) install Antigravity CLI (Google's terminal agent surface)

curl -fsSL https://antigravity.google/cli/install.sh | bash   # macOS/Linux

\# irm https://antigravity.google/cli/install.ps1 | iex        # Windows PowerShell



\# 3) install GStack (Garry Tan's spec/plan/review/ship skill pack) and target Antigravity as the host

\#    NOTE: confirm the exact host flag with `./setup --help` — GStack supports

\#    Claude Code, Codex, Cursor, Gemini and others via --host <name>; verify the

\#    current flag name for Antigravity before running this.

git clone https://github.com/garrytan/gstack.git .gstack-src

./.gstack-src/setup --host antigravity



\# 4) connect Stitch MCP so the agent can pull real design tokens/screens instead of inventing UI

gcloud auth login

gcloud config set project <YOUR\_GCP\_PROJECT\_ID>

gcloud auth application-default set-quota-project <YOUR\_GCP\_PROJECT\_ID>

gcloud beta services mcp enable stitch.googleapis.com

\# then add the Stitch MCP server in Antigravity's MCP settings, scoped to:

\# https://stitch.withgoogle.com/projects/15968334285667068787

```



\*\*First prompt to run inside Antigravity CLI, in the empty `NewME` folder:\*\*



```

/spec



Project: NewME — AI-assisted strength coaching platform, two personas (Trainer, Trainee).

Attach: the file NewME-GStack-Spec.md in this repo as the authority document.

Also pull design context from Stitch project 15968334285667068787 via the Stitch MCP

server before proposing any screen (extract\_design\_context on every existing screen,

list\_screens first). Do not default to generic shadcn starter styling — treat Stitch's

Design DNA (type, color, spacing, motion) as the source of truth for tokens, and only

fall back to shadcn primitives for component \*structure\*, not look.



Go through the five phases (why → scope → technical, with mandatory reading of this

spec file → draft → file). Surface only genuine product/taste decisions for my approval;

don't ask me to re-decide things this document already answers.

```



That gives GStack a real target instead of "build me a fitness app," which is what usually produces the generic-AI-app look you're trying to avoid.



\---



\## 1. Product Brief



\*\*Name:\*\* NewME

\*\*One-liner:\*\* A coach-and-client training platform where a certified trainer builds, publishes, and adapts periodized workout + nutrition programs for each trainee, trainees log every session and photo, and Gemini turns both sides' data into concrete next steps — without either side having to interpret spreadsheets.



\*\*Not building:\*\* a general fitness-tracker-for-everyone (no public exercise marketplace, no social feed, no standalone habit app). Scope is strictly the trainer↔trainee relationship.



\---



\## 2. Personas \& Roles



| Role | Core need |

|---|---|

| \*\*Trainee\*\* | Know exactly what to do today, log it in under 60 seconds, see whether they're actually progressing, and get answered when something feels off — without waiting for their trainer to reply. |

| \*\*Trainer\*\* | See every client's adherence and trend at a glance, build a periodized program once and reuse/adapt it, and get an AI-drafted first pass at programming changes instead of building from scratch every cycle. |



A single account can hold both roles (a trainer can also be someone else's trainee), but the UI is role-scoped, not a toggle buried in settings — you land on the right home screen based on active context.



\---



\## 3. Information Architecture



\*\*Trainee app\*\*

\- Today — the single most important screen: today's date, which program-day this is, morning routine, workout card, diet card, "log this" CTA.

\- Program — full X-week calendar view (start date → end date), tap any day to preview.

\- Log History — past sessions, filterable by exercise or muscle group.

\- Progress — bodyweight chart, per-muscle load/volume charts, PR list, photo timeline + compare.

\- Coach — AI insight feed + chat, plus a direct line to the human trainer.

\- Profile — height/weight/age/sex/injury notes/goals, consent settings for photos and AI analysis.



\*\*Trainer console\*\*

\- Roster — all trainees, adherence %, last check-in, alerts (missed 3+ sessions, plateau flag).

\- Trainee detail — full log/photo/weight history, notes, program assigned + version history.

\- Program Builder — day-by-day editor (see §5.2), AI-assist panel, versioning, publish.

\- Analytics — cross-client trends (are people stalling on the same lift, adherence by day-of-week, etc.).



\---



\## 4. Domain Data Model (core entities)



```

User            { id, role\[trainer|trainee|both], name, dob, sex, heightCm, injuries\[], goals\[] }

TrainerLink     { trainerId, traineeId, status\[active|paused|ended] }



Program         { id, trainerId, traineeId, title, startDate, endDate, durationWeeks,

&#x20;                 status\[draft|published|archived], version, parentVersionId?,

&#x20;                 supplementProtocols: SupplementProtocol\[], hydrationGoal: HydrationGoal }

ProgramWeek     { id, programId, weekIndex }

ProgramDay      { id, weekId, dayOfWeek, label, isRestDay,

&#x20;                 morningRoutine: Block\[], workout: Block\[], nutrition: MealPlan,

&#x20;                 supplementOverrides?: SupplementProtocol\[] }



Block           { id, order, type\[straight|superset|circuit],

&#x20;                 exercises: ExercisePrescription\[] }

ExercisePrescription {

&#x20; exerciseId, sets, repRangeLow, repRangeHigh,

&#x20; rirScheme\[] (per-set RIR target, e.g. \[2,1,0]),

&#x20; restSeconds, loadGuidance (e.g. "double progression from last session"),

&#x20; formCueText, videoUrl, wikiMuscleUrl, targetMuscleGroups\[]

}



Exercise (library) { id, name, primaryMuscle, secondaryMuscles\[], equipment, videoUrl, wikiUrl }



MealPlan        { id, meals: Meal\[] }  // trainer-authored, per-day, mirrors the uploaded doc's format

Meal            { time, label, foods\[], approxKcal, approxProtein, supplements\[] }



SupplementProtocol {

&#x20; id, programId, programDayId?, name, category\[performance|health|recovery|sleep],

&#x20; phases: SupplementPhase\[]

}

SupplementPhase {

&#x20; phaseIndex, name, startDay, endDay?,

&#x20; doses: SupplementDosePrescription\[]

}

SupplementDosePrescription {

&#x20; id, doseOrder, amount, unit\[g|mg|IU|capsules|scoop|ml],

&#x20; timingType\[standalone|meal\_linked],

&#x20; mealLabel?, // link to Meal.label (e.g. "Meal 1: Breakfast", "Post-Workout Shake")

&#x20; standaloneTiming?, // on\_waking|morning|pre\_workout|intra\_workout|post\_workout|afternoon|with\_dinner|pre\_bed

&#x20; targetTime?, notes?

}

SupplementLog   {

&#x20; id, traineeId, programId, protocolId, supplementName, doseId,

&#x20; scheduledDate, status\[taken|skipped|pending], takenAt

}

HydrationGoal   {

&#x20; id, programId, traineeId, dailyTargetMl, workoutDayBonusMl?

}

HydrationLog    {

&#x20; id, traineeId, date, amountMl, loggedAt

}



WorkoutSession  { id, traineeId, programDayId, date, startedAt, endedAt, durationSec,

&#x20;                 setLogs: SetLog\[], notes }

SetLog          { exercisePrescriptionId, setIndex, reps, weightKg, rirAchieved, isPR }



BodyMetricEntry { id, traineeId, date, weightKg, source\[manual|synced] }



ProgressPhoto   { id, traineeId, date, angle\[front|back|side],

&#x20;                 storagePath, faceCropped: true, consentAiAnalysis: bool }



AIInsight       { id, subjectId(trainer|trainee), type\[program\_suggestion|log\_insight|

&#x20;                 photo\_analysis], inputRefs\[], modelOutput, status\[suggested|

&#x20;                 accepted|dismissed], createdAt }

```



Every RIR/double-progression/pull-push-ratio rule from your source document is \*\*data on `ExercisePrescription` and `Block`\*\*, not hardcoded logic — that document becomes the first seeded `Program` template, not a special case in the engine.



\---



\## 5. Feature Specifications



\### 5.1 Auth \& Onboarding

\- Email/passkey auth (Firebase Auth / Identity Platform).

\- Trainer invites trainee by email → trainee completes profile (height, weight, age, sex, injuries, goals, baseline photos optional) → linked.

\- Age gate: 18+ to enable photo-analysis and body-composition AI features (see §6).



\### 5.2 Program Builder (Trainer)

\- Set program name, \*\*start date → end date\*\* (duration in weeks is derived, not typed twice).

\- Day-by-day grid, Mon–Sun × week N. Each day: rest day toggle, morning routine block, workout blocks, nutrition plan.

\- Per exercise: pick from library or add custom; set rep range, per-set RIR target, rest timer, \*\*superset/circuit grouping\*\* (drag exercises into a shared block so the app renders and times them as one), video URL, and a "muscle wiki" link (defaults to a curated muscle-anatomy reference if the trainer doesn't supply one).

\- Nutrition tab per day: meals with time, foods, approx kcal/protein, supplement timing — same structure as the uploaded plan.

\- \*\*Draft → Publish\*\* workflow with version history; publishing pushes the program to the trainee's app immediately and archives the previous version (trainee's in-flight logs stay attached to the version they were logged against).

\- \*\*AI-assist panel\*\* (see §5.8) sits alongside the manual editor at every step — never replaces it.



\### 5.3 Program Consumption (Trainee)

\- "Today" resolves automatically from `startDate + elapsed days` against the calendar, so the trainee never has to find their place.

\- Full program view shows week-by-week structure with dates, so they can see "3 weeks left."

\- Each exercise card shows sets/reps/RIR/rest, an embedded video, and a link to a muscle-anatomy reference so they understand \*why\* (this directly answers your "so trainee knows how to do it" requirement).



\### 5.4 Workout Logging Engine

\- Start Session → per-exercise input for weight × reps per set, rest-timer auto-starts between sets (respecting the block's `restSeconds`, and running once per superset round if the block type is `superset`).

\- Auto-detects PRs (best weight×reps for that exercise) and flags them.

\- On finish: total session duration is captured automatically (start→end timestamp) and stored on `WorkoutSession`, alongside every `SetLog`.

\- Session log is immediately visible to the trainer console.



\### 5.5 Progress Metrics

\- Bodyweight over time (line chart), with the weekly-weigh-in cadence pattern from your doc supported as a configurable check-in rule, not hardcoded.

\- \*\*Per-muscle-group load/volume\*\*: derived by summing `weight × reps` from `SetLog` joined through `ExercisePrescription.targetMuscleGroups`, rolled up per muscle group and per week — this is what lets a trainee see "back volume trending up, chest flat" without a spreadsheet.

\- PR timeline per exercise.



\### 5.6 Progress Photos + Visual Compare

\- Capture flow: front / back / side, guided pose overlay.

\- \*\*Mandatory face-crop step before upload\*\* — client-side crop UI runs before any bytes leave the device; the app never stores an un-cropped face image, and this is enforced server-side too (reject uploads that still contain a detectable face box).

\- Compare view: pick any two dates (e.g., front @ month 1 vs. front @ today) → side-by-side or slider overlay.

\- Timeline strip per angle for quick scrubbing.



\### 5.7 AI Photo Analysis (Trainee or Trainer initiated)

\- Either party can submit 1–3 cropped photos (front/back/side) to Gemini for a physique read: which muscle groups look proportionally developed vs. lagging, posture observations, suggested training emphasis.

\- This is \*\*framed as training feedback, not a medical or body-image judgment\*\* — copy is neutral and constructive ("back appears to be lagging relative to chest/shoulders — consider prioritizing pulling volume"), never about body fat percentage estimates, weight-loss framing, or appearance judgments beyond muscular development relevant to training.

\- Requires explicit per-submission consent (`consentAiAnalysis`); trainees can disable this feature entirely in Profile.

\- Output is stored as an `AIInsight` of type `photo\_analysis`, visible to both trainer and trainee, and the trainer can turn a suggestion directly into a program edit.



\### 5.8 AI Program Assistant (Trainer side — Gemini 3.8 Flash)

\- Given a trainee's full profile (age, sex, height, injuries, goals) plus their logged history (adherence, load progression per muscle group, plateau signals, weigh-ins), Gemini proposes:

&#x20; - Next block's rep ranges / RIR scheme adjustments.

&#x20; - Where to nudge the pull:push or upper:lower ratio if logs show imbalance.

&#x20; - Deload or exercise-substitution suggestions where a lift has stalled for 2+ weeks.

\- \*\*Supplement \& Hydration Signal Consumption\*\*: Ingests supplement adherence % and hydration target % alongside workout logs. Flags protocol compliance issues and correlates them with recovery or performance stalls (e.g. "Creatine loading phase missed 2 doses this week; hydration at 62% of target on heavy compound days — recommend addressing hydration baseline before altering training volume"). Suggests phase adjustments or simplifying multi-dose stacks if compliance is low.

\- Output lands as an editable \*\*draft diff\*\* on top of the current program — trainer accepts, edits, or rejects line by line. The AI never auto-publishes.



\### 5.9 AI Insights Coach (Trainee side — Gemini 3.8 Flash)

\- Runs against the trainee's own log history + body metrics: "your bench load has been flat for 3 sessions but reps are climbing — that's still progress," "you've hit face pulls at 0 RIR for 2 weeks straight, this is likely your limiting set." Conversational follow-up is supported (Vercel AI SDK `useChat` streaming against a Gemini-backed API route).

\- \*\*Supplement \& Hydration Coaching\*\*: Delivers contextual reminders and positive reinforcements tied to the trainee's scheduled doses and running hydration total (e.g. "Creatine loading phase missed 2 doses this week — try pairing your midday dose with your post-workout shake," "You're at 2.5L / 3.5L hydration today; 2 glasses left to hit optimal recovery hydration").

\- Insights are informational/motivational only — no medical, injury-diagnosis, or extreme-deficit dieting advice; if a trainee describes pain or injury, the assistant should suggest they flag it to their human trainer or a medical professional rather than prescribing around it.



\### 5.10 Trainer Console / Roster \& Analytics

\- Roster table: workout adherence %, supplement adherence %, hydration adherence %, last logged session, current program week, alerts (3+ missed days, flat progress ≥2 weeks, supplement compliance <70%, hydration <60%). Visual treatment uses matching color-coded chip badges (green ≥85%, amber 70–84%, red <70%) across all three adherence dimensions.

\- Per-trainee detail: full log history, weight chart, photo timeline, supplement & hydration compliance breakdown (per-supplement weekly compliance, daily hydration pacing, active phase status), program version history, notes field.

\- Cross-client analytics: which exercises stall most often, adherence by day of week, cross-client supplement protocol completion rates — useful for the trainer to spot patterns across their whole client base, not just one person.



\### 5.11 Supplement \& Hydration Tracking System

\#### 5.11.1 Trainer Authoring \& Phase-Based Dosing

\- \*\*Hierarchical Protocol Scope\*\*: Defined at the `Program` level (applies across the entire block) with optional overrides on specific `ProgramDay`s (e.g. pre-workout caffeine or intra-workout EAAs only on lifting days).

\- \*\*Named Supplements \& Attributes\*\*: Supports multi-supplement stacks (Creatine Monohydrate, Vitamin D3+K2, Omega-3 Fish Oil, Magnesium Glycinate, Ashwagandha KSM-66, etc.) with precise amount, unit (`g`, `mg`, `IU`, `capsules`, `scoop`, `ml`), and timing category.

\- \*\*Phase-Based Dosing Lineage\*\*: Allows trainers to author phase transitions once across the program duration without manually editing every calendar day:

&#x20; - \*\*Phase 1 (Loading)\*\*: e.g. Days 1–7 with 4 doses/day (5g each = 20g/day total).

&#x20; - \*\*Phase 2 (Maintenance)\*\*: e.g. Days 8+ with 1 dose/day (5g/day total).

&#x20; - The resolution engine computes the trainee's active program day (`today - program.startDate + 1`) and resolves the active phase's prescribed doses automatically.

\- \*\*Meal Linkage vs. Standalone Timing\*\*:

&#x20; - \*\*Meal-Linked\*\*: Doses can link directly to a meal or shake from `MealPlan.meals` (e.g. "Meal 1: Breakfast", "Post-Workout Shake").

&#x20; - \*\*Standalone\*\*: Doses can specify physiological timing anchors (`on_waking`, `morning`, `pre_workout`, `intra_workout`, `post_workout`, `afternoon`, `with_dinner`, `pre_bed`, or target clock time `HH:mm`).



\#### 5.11.2 Trainee Today Screen Experience

\- \*\*Time-Ordered Chronological Integration\*\*: Doses due today appear directly on the Today home screen alongside workout blocks and nutrition cards in chronological order (e.g. 07:00 On Waking Hydration + Creatine Dose 1 → 08:30 Breakfast + Vitamin D3+K2 → 17:00 Workout → 18:30 Post-Workout Shake + Creatine Dose 2 → 22:00 Pre-bed Magnesium).

\- \*\*Dose-Level Check-Off (`SupplementLog`)\*\*: Trainees tap to check off individual doses when taken. Logs record exact timestamp (`takenAt`), dose index, and status (`taken` | `skipped` | `pending`), enabling granular dose compliance rather than binary all-or-nothing daily flags.

\- \*\*Hydration Progress Widget (`HydrationGoal` + `HydrationLog`)\*\*:

&#x20; - Trainer-configured daily target in ml/L (e.g. 3,500 ml / 3.5 L), with optional workout-day bonus adjustments (+500 ml).

&#x20; - Running total progress bar displayed prominently on Today with current percentage and volume remaining.

&#x20; - Quick-add increment buttons for sub-second logging: `+250ml` (Glass), `+500ml` (Bottle), `+750ml` (Shaker), `+1000ml` (Jug), plus custom entry.



\#### 5.11.3 Compliance \& Adherence Engine

\- \*\*Per-Supplement Compliance\*\*: `(Doses Taken / Doses Scheduled) × 100` calculated over the active week and program lifecycle.

\- \*\*Weekly Supplement Adherence\*\*: Aggregated across all active protocols for each calendar week (Monday–Sunday).

\- \*\*Hydration Target Attainment\*\*: Daily attainment % (`loggedMl / targetMl`), rolling 7-day average adherence %, and consistency score.



\#### 5.11.4 Trainer Console Integration

\- \*\*Roster Table\*\*: Dedicated `Supplements` and `Hydration` adherence columns sitting directly beside `Workout Adherence`, using identical color-coded badge treatments.

\- \*\*Trainee Detail View\*\*: Detailed breakdown card featuring:

&#x20; - 7-day adherence comparison (Workout vs Supplement vs Hydration).

&#x20; - Active protocol phase status badge (e.g. "Creatine: Maintenance Phase — Day 9 of Program").

&#x20; - Dose-by-dose adherence log table and hydration volume pacing chart.

\- \*\*Coaching Alerts\*\*: Automated warning flags when a trainee falls below 70% supplement compliance or 60% hydration target over rolling 7 days.



\#### 5.11.5 AI Signal Integration

\- \*\*Trainer AI Program Assistant\*\*: Consumes supplement and hydration adherence metrics in the Gemini 3.8 Flash prompt context to correlate recovery deficits, recommend protocol deloads, or flag excessive protocol complexity.

\- \*\*Trainee AI Insights Coach\*\*: Consumes real-time daily intake logs to provide proactive, habit-forming guidance (e.g. "Creatine loading phase missed 2 doses this week; hydration at 62% of target") without judgment or disordered eating patterns.



\---



\## 6. Non-Functional Requirements \& Responsible-AI Guardrails



\- \*\*Mobile-first, installable PWA\*\* — this is a phone-in-the-gym-bag product; desktop is the trainer's secondary surface for program building, not the trainee's primary one.

\- \*\*Privacy/consent for photos\*\*: cropped storage only, per-photo AI-analysis consent, trainee can delete any photo (soft-delete with 30-day purge), signed URLs with short TTL out of Cloud Storage, never public buckets.

\- \*\*No disordered-eating or body-shaming vectors\*\*: nutrition targets are trainer-set ranges, not the app auto-generating aggressive deficits; AI copy avoids appearance-judgment language; weight tracking is optional per trainee and can be hidden from their own view if a trainer flags concern (trainer still sees it).

\- \*\*18+ gate\*\* on physique-photo AI analysis specifically.

\- \*\*Accessibility\*\*: WCAG AA contrast minimum, full keyboard nav on the trainer console, captions/alt text on exercise videos where available.



\---



\## 7. Architecture \& Tech Stack



\*\*Frontend\*\*

\- Next.js (App Router) + TypeScript, deployed as a container to \*\*Cloud Run\*\*.

\- Tailwind + \*\*shadcn/ui\*\* for component \*structure\* (forms, dialogs, tables) — but themed entirely from tokens pulled via \*\*Stitch MCP\*\* (`extract\_design\_context` against your Stitch project) so it doesn't read as a stock shadcn app. Custom type scale, OKLCH-based color system, restrained motion (Framer Motion) rather than default shadcn grays.

\- \*\*Vercel AI SDK\*\* (`ai` package, `useChat`/`streamText`) for the trainee Coach chat and the trainer AI-assist panel — model calls route through a server action/API route that calls Gemini 3.8 Flash server-side (key never touches the client).



\*\*Backend / data\*\*

\- Cloud Run services (API) or Next.js server actions for simpler cases.

\- \*\*Firestore\*\* for the program/session/log domain model (fits the nested Program→Week→Day→Block shape well) or Cloud SQL/Postgres via Drizzle if you prefer relational joins for the analytics queries in §5.5/§5.10 — pick one; Postgres is the safer choice once cross-client analytics (§5.10) matter, since muscle-group volume rollups are naturally SQL aggregations.

\- \*\*Cloud Storage\*\* for photos and videos, signed URLs, lifecycle rule to purge soft-deleted photos.

\- \*\*Identity Platform / Firebase Auth\*\* for auth.

\- \*\*Vertex AI / Gemini API\*\* — `gemini-3.8-flash` (multimodal: text, image, video, audio; 1M-token context; supports a `thinking\_level` of low/medium/high instead of the old `thinking\_budget`) for both the program-assistant text reasoning and the photo-analysis vision calls.

\- \*\*Cloud CDN\*\* in front of static assets and exercise videos.



\*\*Design-to-code loop\*\*

\- Author/iterate screens in the Stitch project (`15968334285667068787`).

\- Antigravity, via Stitch MCP, calls `extract\_design\_context` before generating each screen and `fetch\_screen\_code`/`fetch\_screen\_image` when a screen already exists in Stitch, so implementation matches design rather than the agent inventing its own layout.



\---



\## 8. Design Direction (explicit anti-generic-AI-app brief)



Hand this to the agent as a standing constraint, not a one-time note:

\- Pull real tokens from Stitch before generating any screen — don't default to shadcn's stock `zinc`/`slate` palette or default `Inter`-everywhere type stack.

\- Data-dense screens (roster, program builder, per-muscle charts) should look like a coaching tool, not a wellness-app pastel dashboard — think structured tables, sparklines, and a confident type hierarchy over big rounded cards and gradient blobs.

\- Motion should be functional (rest-timer countdown, set-completion checkmark, chart transitions), not decorative.



\---



\## 9. Build Phases



1\. \*\*MVP\*\*: Trainer builds/publishes a single-trainee program manually (§5.2 minus AI-assist), trainee views/logs it (§5.3–5.4), bodyweight chart, basic roster.

2\. \*\*V1\*\*: Per-muscle volume charts (§5.5), progress photos + compare (§5.6), trainer analytics (§5.10).

3\. \*\*V2\*\*: Gemini program assistant (§5.8), Gemini trainee insights/chat (§5.9), Gemini photo analysis (§5.7).



\---



\## 10. Open Questions (need your call before `/spec` finalizes)



1\. Firestore vs. Postgres for the domain store — recommend Postgres given the analytics load in §5.10, but this is your infra call.

2\. Should a trainee be able to see their trainer's AI-assist drafts before the trainer publishes, or only the final published diff?

3\. Video hosting: self-hosted in Cloud Storage/CDN vs. linking out to YouTube search results (as the source doc did) — self-hosting gives a consistent experience but is more storage/CDN cost.

