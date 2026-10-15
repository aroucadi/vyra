# VYRA Autonomous Biomechanical Engine — The 10 Core Principles

Every interface, component, mathematical algorithm, and design system token across Vyra is governed by these 10 Core Principles:

---

### Principle 1: One Anchor, Specialized Workspaces
`Today` (`/today`) is the single temporal anchor of the athlete's daily routine. Deep workflows are organized into four dedicated, high-performance workspaces: `Program` (`/program`), `Exercises` (`/exercises`), `You` (`/you`), and the full-screen active gym floor (`/session`). Workspaces are clean, focused, and free of extraneous clutter.

### Principle 2: Moments, Not Features
Capabilities surface chronologically and contextually based on the athlete's current state. If an action or datum is not relevant right now, it is completely hidden from the primary viewport. Past moments collapse into subtle checkmarks; the active moment stands out as the hero.

### Principle 3: One Shared Brain
Subsystems actively communicate through structured signals:
- Sleep duration and resting HRV modulate prescribed training volume, axial loading, and RPE.
- Training tonnage modulates post-workout carbohydrate, fluid, and sodium replenishment.
- Postural symmetry ratios modulate warm-up activation drills and corrective exercise selection.
Cross-domain insights are surfaced as concise, single-sentence observations with actionable triggers.

### Principle 4: Coach as Connective Tissue, Never a Blocker
The AI Coach is reachable quietly from anywhere via contextual chips (`[Swap Exercise]`, `[Why this weight?]`, `[Short on time]`) and header links. It adapts plans, explains biomechanical rationale, and parameterizes typed action cards. The core training loop operates with complete autonomy and never requires AI availability to function.

### Principle 5: Three Depths Everywhere
Every capability enforces three progressive disclosure tiers:
1. **Glance**: One clear eyebrow and one concise status line.
2. **Act**: Exactly one primary interactive control (one tap to check, one stepper to log).
3. **Learn**: Detailed anatomical spotlights, biomechanical guides, scientific citations, and set history. **Learn content is ALWAYS behind a non-blocking tap (Sheet/Drawer/Popover), never rendered inline.**

### Principle 6: Five Minimalist Compound Primitives
The entire application is constructed from five composable primitives: **Card**, **Checkin**, **Log**, **Insight**, and **Plan**. Once an athlete learns how to log a training set, they intuitively know how to log readiness, check supplements, or inspect program days.

### Principle 7: Calm by Default & Negative Constraints
- 60-30-10 Obsidian dark surface hierarchy (`#0B0F17` canvas, `bg-slate-900/60` cards, `#10B981` Emerald primary accent).
- **Vertical Element Ceiling**: Maximum 3 elements per card context (Category $\to$ Hero Content $\to$ Action).
- **Single Dominant CTA**: Exactly one solid primary action button per viewport state.
- **Tabular Numerals**: All numbers, weights, reps, and timers enforce `tabular-nums` to eliminate layout jitter.
- **No Unsegmented Monoliths**: Zero endless vertical scrolling; progressive disclosure via segmented controls and drawers.

### Principle 8: Deterministic Math Over Generative Hallucinations
Sports science math must be mathematically exact:
- Submaximal 1RM calculations (Epley, Brzycki, Lombardi, etc.) and RTS Weighted Ensembles are computed via verified TypeScript functions.
- Barbell plate breakdowns use greedy deterministic algorithms matching standard gym inventories.
- Progression steps and 10% deload triggers execute strictly on stall streak thresholds.
Generative AI models are strictly prohibited from calculating numbers, loads, or plate distributions.

### Principle 9: Strict Effort Budget
Every recurring in-gym action operates under an aggressive speed budget:
- Starting a workout from the home screen: $\le$ 2 taps, $\le$ 3 seconds.
- Logging a gym set on the active floor: $\le$ 2 taps, $\le$ 5 seconds.
- Searching 6,554 exercises with gym shorthands (`db`, `rdl`, `ohp`): $\le$ 10 milliseconds.
- Interactive touch targets must be $\ge 44 \times 44\text{px}$ with $\ge 8\text{px}$ spacing to prevent mis-taps with sweaty hands.

### Principle 10: Offline-First Resilience
The active gym floor must never fail in dead-zone gym basements:
- Set-level draft journaling persists to IndexedDB and localStorage in <2ms with automatic 4-hour crash recovery.
- Network mutations are placed in an idempotent replay queue with exponential backoff and jitter.
- The 6,554-exercise catalogue and PWA assets are precached by the Service Worker, ensuring 100% offline search and execution.
