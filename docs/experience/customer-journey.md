# VYRA Autonomous Biomechanical Engine — Customer Journey Map

A progressive athletic journey that earns complexity over time. A Day-0 lifter experiences an ultra-fast, zero-friction set logging and exercise search engine; advanced biomechanical intelligence and structural balance analytics unlock naturally as training history accumulates.

---

## The 5 Progressive Athletic Stages

| Stage | Trigger | Screens & Workspaces | Primary Action ($\le$ Budget) | Success Metric | Failure / Recovery State |
|:---|:---|:---|:---|:---|:---|
| **Stage 1: Day 0 Onboarding & Activation** | First app launch / PWA installation | Entry $\to$ `/today` or `/exercises` | Tap **[ START WORKOUT ]** on Hero or search catalogue ($\le$ 30s) | $\le$ 30s to first workout; zero drop-offs on permissions | **Recovery**: Zero mandatory onboarding surveys. If skipped, immediately loads today's prescribed split on `/today`. |
| **Stage 2: Week 1 Core Gym Floor Habit** | Scheduled workout notification (max 1/day) | `/today` $\to$ `/session` (Active Gym Floor) | Log sets via pre-filled steppers ($\le$ 5s/set); rest with audio timer & wake lock | 3 completed workout logs in first 7 days; 0 data loss | **Recovery**: Missed session? Timeline rolls the day forward gracefully without streak guilt or red warning banners. |
| **Stage 3: Weeks 2–3 Biomechanical Adaptation** | Occupied equipment or stall streak | `/session` $\to$ `<SubstitutionCopilotDrawer />` | 1-tap equipment swap or apply automated progression step | $\ge$ 40% adoption of copilot swaps and auto-progression | **Recovery**: Trainee prefers custom load? 1-tap stepper override or instant 1-tap Undo on automated swaps. |
| **Stage 4: Month 1 Postural Symmetries** | 15th session logged + anchor lifts established | `/posture` (`<StructuralBalanceRadar />`) & `/progress` | Review Poliquin/Thibaudeau ratios; inject corrective protocol | Verified 2:1 pull-to-push volume ratio; zero joint impingements | **Recovery**: Missing anchor lift? System flags "Needs Anchor Session" without skewing other lift ratios. |
| **Stage 5: Month 3+ Mesocycle Mastery** | 16-week mesocycle completion | `/program` & `/program/new` (Agentic RAG) | Review longitudinal PR curves; generate next 16-week mesocycle | 90-day retention $\ge$ 70%; automated deload triggered on stalls | **Recovery**: 3 consecutive stalls on compound lift? Progression engine automatically prescribes a 10% Epley reset deload. |

---

## Detailed Stage Breakthroughs

### Stage 1: Day 0 Onboarding & Activation
- **Zero-Friction Access**: The lifter lands immediately on `/today` or can explore 6,554 movements at `/exercises`.
- **Zero Survey Fatigue**: No 20-question questionnaires before touching the core product. The 16-week master protocol is pre-loaded and ready for immediate lifting.
- **Speed to Value**: Less than 30 seconds from app launch to active set logging.

### Stage 2: Week 1 Core Gym Floor Habit Loop
- **Gym Floor Dominance**: The full-screen gym mode (`/session`) unmounts global navigation to prevent mis-clicks.
- **Sweat-Thumb Optimization**: Steppers are pre-filled with target loads, with hit targets $\ge 44 \times 44\text{px}$.
- **Active Rest Management**: Tapping **[ Log Set & Rest ]** starts the `<RestIntervalBar />`, emits a synthetic audio chime upon zero, and keeps the screen awake via the Screen Wake Lock API.
- **Offline Reliability**: Every logged set writes ahead to IndexedDB in <2ms, guaranteeing zero data loss in basement gyms.

### Stage 3: Weeks 2–3 Biomechanical Adaptation & Substitution
- **Equipment Conflict Resolution**: If a bench or cable column is taken, the athlete taps "Equipment Busy" to open `<SubstitutionCopilotDrawer />`, selecting an alternative from the 6,554 OpenGym catalogue with matched resistance curves.
- **Automated Progression Engine**: When all sets hit the rep range ceiling (e.g. 3 sets of 10), the system automatically advances weight for the next session (+2.5kg upper, +5kg lower).

### Stage 4: Month 1 Postural Symmetries & Structural Balance
- **Postural Diagnosis**: Athlete navigates to `/posture` to inspect the `<StructuralBalanceRadar />`.
- **Scientific Benchmarks**: Strength ratios are evaluated against Poliquin (Close-Grip Bench anchor) and Thibaudeau standards.
- **Corrective Injection**: If external rotators or lower traps fall into the "Weak" band, a 1-tap corrective isolation block is injected into the weekly warm-up.

### Stage 5: Month 3+ Mesocycle Mastery & Autonomous Athlete
- **Longitudinal Telemetry**: Athlete tracks volume curves, PR history, and body mass trends at `/progress`.
- **Stall & Deload Management**: If an athlete misses target reps across 3 consecutive sessions, the engine enforces a 10% deload to dissipate systemic fatigue.
- **Custom Mesocycle Generation**: The athlete or coach can access `/program/new` to generate a new periodized 16-week mesocycle tailored to newly established 1RMs using the Agentic RAG builder.
