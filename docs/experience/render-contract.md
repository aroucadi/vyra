# VYRA Render Contract & Anti-Slop Specification

> **Authority**: gStack Senior Product Designer & AGENTS.md Design Guidelines  
> **Target**: All UI screens, components, animations, and in-gym operational surfaces.  
> **Core Law**: **Replace adjectives with specifications.** "Modern" and "clean" are banned as design directives. Use hex codes, millisecond durations, damping ratios, and strict token hierarchies.

---

## 1. Negative Constraints & Banned Defaults

The following AI-generated cliches, decorative slop, and lazy defaults are **strictly prohibited** across Vyra:

1. **No Purple / Blue Neon Gradients**:
   - ❌ BANNED: `bg-gradient-to-r from-purple-600 to-indigo-600` or arbitrary neon gradient meshes.
   - ✅ MANDATED: Obsidian `#0B0F17` canvas surface with structural Slate `#111827` / `bg-slate-900/60` cards.
2. **No Blurry Decorative Glows / Glassmorphic Blobs**:
   - ❌ BANNED: Over-saturated `blur-3xl` orbs floating aimlessly behind content.
   - ✅ MANDATED: High-contrast borders (`border-slate-800`), crisp surfaces, and precise typography.
3. **No Floating Particles or AI Sparkle Slop**:
   - ❌ BANNED: Generic sparkle icons (`✨`) denoting vague "AI magic".
   - ✅ MANDATED: Transparent biomechanical telemetry tags and specific rationale chips.
4. **No "Fade and Slide Up on Everything at Once"**:
   - ❌ BANNED: Stacking 6 cards that all animate in together with identical timing.
   - ✅ MANDATED: Hierarchy through rank. Hero element appears first. Secondary elements follow with +60ms stagger at 50% to 70% intensity.
5. **Opacity Never Bounces**:
   - ❌ BANNED: Spring physics applied to alpha/opacity channels (creates sickening strobe effect).
   - ✅ MANDATED: Position and scale may use restrained springs ($\zeta = 0.82$); opacity must always use smooth monotonic easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
6. **No Unsegmented Monoliths**:
   - ❌ BANNED: Dumping 5+ independent features, workout splits, or protocols into a single flat vertical scroll.
   - ✅ MANDATED: Structure features using progressive disclosure: segmented tabs, tabbed navigation, or collapsible bottom drawers.

---

## 2. 3-Tier Color Hierarchy (60-30-10 Rule)

- **60% Neutral Canvas Surface**:
  - Main background: `#0B0F17` (Obsidian / Slate 950)
  - Card background: `#111827` (`bg-slate-900/60` with backdrop blur)
- **30% Structural Contrast**:
  - Borders & Dividers: `#1E293B` (`border-slate-800`)
  - Secondary text / icons: `#94A3B8` (`text-slate-400`)
  - Section headers & labels: `#CBD5E1` (`text-slate-300`)
- **10% Purposeful Accent**:
  - Primary Training Target / PRs / Active CTA: `#10B981` (Emerald 500)
  - Synergist / Fuel / Hydration: `#06B6D4` (Cyan 500)
  - Rest / Recovery / Circadian: `#6366F1` (Indigo 500)
  - Structural Weakness / Joint Alert: `#F43F5E` (Rose 500)
  - *Rule: Never use more than 1 accent hue on a single UI card container. Explicit Exemption: Functional SVG biomechanical telemetry (`<AnatomicalTensionSpotlight />` and `<StructuralBalanceRadar />`) may pair Emerald `#10B981` (primary prime mover) with Cyan `#06B6D4` (synergist stabilizer) and a functional SVG `drop-shadow(0 0 6px rgba(16,185,129,0.35))` to encode dual-muscle activation.*

---

## 3. Motion & Feedback Timing Specs

All interface motion must conform strictly to `src/lib/motion.ts`:

| Interaction Type | Duration (`ms`) | Curve / Physics | Behavior |
|:---|:---:|:---|:---|
| **Tactile Tap / Press** | `150ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Active state scales to `0.98` for instant tactile response; Day-0 calibration updates within `150ms`. |
| **Checkbox / Set Log** | `100ms` | Instantaneous toggle | Immediate green fill + subtle badge pop ($\zeta = 0.70$). |
| **Drawer / Sheet Slide** | `400ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Bottom-to-top sheet with backdrop fade. |
| **Screen / Hero Entrance** | `750ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Hero card leads; supporting elements stagger by `60ms`. |
| **Readability Hold** | $\ge 3000\text{ms}$ | Stationary | Any dynamic alert or insight must hold stationary for at least 3 seconds. |

---

## 4. Operational Screen Density & Touch Rules (`AGENTS.md`)

1. **Vertical Element Ceiling**: Maximum 3 functional elements stacked in a card context (1: Category/Eyebrow $\to$ 2: Hero Content/Value $\to$ 3: Action/Status).
2. **Single Dominant CTA per Viewport**: Exactly one solid primary action button per screen state. All secondary actions must be outline, ghost, or muted link styling.
3. **Touch Target Floor**: Interactive targets must be $\ge 44 \times 44\text{px}$ with $\ge 8\text{px}$ spacing between interactive elements.
4. **Data Jitter Elimination**: All numeric counters, weights, reps, timers, and percentages must specify `font-variant-numeric: tabular-nums` (`tabular-nums`).
5. **Metric Density Cap**: Maximum 3 to 4 metrics per summary card. Never present high-density cognitive overload upfront.

---

## 5. Biomechanical Primitive Render Contracts

### 5.1 `<AnatomicalTensionSpotlight />` Micro-Torso
- **File**: `src/components/trainee/AnatomicalTensionSpotlight.tsx`
- **Architecture**: Pure vector SVG micro-silhouette. Zero WebGL/canvas dependency, zero layout shift, 0ms render latency. Free-tier unlocked (`anatomical_tension_spotlight` in `TIER_CAPABILITIES.FREE`) so the Day-0 onboarding hero matches inbound social clips 1:1.
- **Micro-Segmented Selector**: Two-state toggle for `Anterior` and `Posterior` anatomical views.
- **Color Mapping**:
  - Target Prime Mover: Emerald `#10B981` (`fill-[#10B981]`, functional SVG filter `drop-shadow(0 0 6px rgba(16,185,129,0.35))`)
  - Synergists & Stabilizers: Cyan `#06B6D4` (`fill-[#06B6D4]`)
  - Neutral Musculature: Dark Slate `#334155` (`fill-slate-700/60`)
- **Visual Scale**: Max height `160px` in exercise detail sheet; `120px` in active `/session` and Day-0 `/today` hero cards.

### 5.2 Kinetic Anchors Typography Contract
Every prescribed movement renders exactly two concise kinetic cues sized for arm's-length gym-floor legibility (`15px–16px`):
- ⚡ **Setup Anchor**: Spatial foundation, joint placement, and stabilization base.
  - *Typography*: `text-[15px] leading-snug text-slate-100`, max 10 words.
  - *Example*: *"Retract scapulae; pack lats tight against bench pad."*
- 🎯 **Kinetic Drive**: Concentric trajectory, prime mover cue, and velocity intent.
  - *Typography*: `text-[15px] leading-snug text-slate-100`, max 10 words.
  - *Example*: *"Drive elbows toward hips; accelerate through the stick point."*

### 5.3 `<PlateCalculatorPopover />`
- **File**: `src/components/trainee/PlateCalculatorPopover.tsx`
- **Barbell Selection**:
  - Olympic Barbell: `20kg / 45lb`
  - Women's Barbell: `15kg / 35lb`
  - EZ Barbell: `10kg / 25lb`
  - Smith Machine: Configurable `0–15kg` (default `9kg`)
- **Greedy Loading Algorithm**: Computes exact per-side plate counts from standard inventory (`25kg`, `20kg`, `15kg`, `10kg`, `5kg`, `2.5kg`, `1.25kg`, `0.5kg`).
- **Render Output**: Horizontal pill chips indicating per-side counts (e.g. `2x 20kg · 1x 5kg · 1x 1.25kg`). If target weight is odd, displays exact loadable weight plus remainder chip (`+1.2kg remainder`).

### 5.4 Rest Timers & Audio / Screen Wake Lock Engine
- **`<RestIntervalBar />`**: Dynamic progress bar mounted at top of active set card during rest intervals.
- **Synthetic Web Audio API (`sound.ts`)**:
  - Zero external MP3 file dependencies (eliminates asset download latency and CORS failures).
  - Short 440Hz alert pip and 880Hz completion chime synthesized directly via `AudioContext.createOscillator()`.
  - Initialized strictly upon first user interaction (touch/click).
  - Oscillator nodes automatically disconnected and garbage-collected upon note finish.
- **Screen Wake Lock API (`wakelock.ts`)**:
  - Calls `navigator.wakeLock.request('screen')` during active session to keep phone screen awake between sets.
  - Releases cleanly on component unmount and page blur/visibility change.
  - Gracefully catches `NotAllowedError` or unsupported browsers without throwing.

### 5.5 `<SubstitutionCopilotDrawer />`
- **File**: `src/components/trainee/SubstitutionCopilotDrawer.tsx`
- **Trigger**: 1-tap "Equipment Busy / Swap" chip in `/session` or `/exercises`.
- **Equipment Modality Filter**: Segmented chips for `Barbell`, `Dumbbell`, `Cable`, `Machine`, `Bodyweight`.
- **Biomechanical Ranking**: Ranks candidates based on muscular subdivision (e.g. Clavicular Pec vs Sternal Pec) and resistance profile (Lengthened vs Shortened).
- **Rationale Card**: 1 concise sentence explaining the swap rationale.
- **Mutation Affordance**: 1-tap `[ Confirm Swap ]` mutates active workout session, recalibrates target weight via 1RM math, preserves all previously logged sets, and presents an immediate 1-tap `Undo`.
