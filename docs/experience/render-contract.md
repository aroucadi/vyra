# VYRA Render Contract & Anti-Slop Specification

> **Authority**: gStack Senior Product Designer & Knowledge Base Standards  
> **Target**: All UI screens, components, animations, and marketing surfaces.  
> **Core Law**: **Replace adjectives with specifications.** "Modern" and "clean" are banned as design directives. Use hex codes, millisecond durations, and damping ratios.

---

## 1. Negative Constraints & Banned Defaults

The following AI-generated cliches and lazy defaults are **strictly prohibited** in VYRA:

1. **No Purple / Blue Neon Gradients**:
   - ❌ BANNED: `bg-gradient-to-r from-purple-600 to-indigo-600`
   - ✅ MANDATED: Obsidian `#0B0F17` canvas with structural Slate `#111827` cards.
2. **No Blurry Decorative Glows / Glassmorphic Blobs**:
   - ❌ BANNED: Over-saturated `blur-3xl` colored background orbs behind content.
   - ✅ MANDATED: High-contrast borders (`border-slate-800`), crisp surfaces, and precise typography.
3. **No Floating Particles or AI Sparkle Slop**:
   - ❌ BANNED: Generic sparkle icons (`✨`) denoting "magic" intelligence.
   - ✅ MANDATED: Transparent biomechanical telemetry tags and specific rationale chips.
4. **No "Fade and Slide Up on Everything at Once"**:
   - ❌ BANNED: Stacking 6 cards that all animate in together with identical timing.
   - ✅ MANDATED: Hierarchy through rank. Hero element appears first. Secondary elements follow with +60ms stagger at 50% to 70% intensity.
5. **Opacity Never Bounces**:
   - ❌ BANNED: Spring physics applied to alpha/opacity channels (creates sickening strobe effect).
   - ✅ MANDATED: Position and scale may use restrained springs ($\zeta = 0.82$); opacity must always use smooth monotonic easing (`cubic-bezier(0.16, 1, 0.3, 1)`).

---

## 2. 3-Tier Color Hierarchy (60-30-10 Rule)

- **60% Neutral Canvas Surface**:
  - Main background: `#0B0F17` (Obsidian / Slate 950)
  - Card background: `#111827` (Slate 900)
- **30% Structural Contrast**:
  - Borders: `#1E293B` (Slate 800)
  - Secondary text / icons: `#94A3B8` (Slate 400)
  - Section headers & labels: `#CBD5E1` (Slate 300)
- **10% Purposeful Accent**:
  - Primary Training Accent: `#10B981` (Emerald 500)
  - Nutrition / Fuel Accent: `#06B6D4` (Cyan 500)
  - Rest / Sleep Accent: `#6366F1` (Indigo 500)
  - Danger / Alert Accent: `#F43F5E` (Rose 500)
  - *Rule: Never use more than 1 accent hue on a single card.*

---

## 3. Motion & Feedback Timing Specs

All interface motion must conform to `src/lib/motion.ts`:

| Interaction Type | Duration (`ms`) | Curve / Physics | Behavior |
| :--- | :---: | :--- | :--- |
| **Tactile Tap / Press** | `150ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Active state scales to `0.98` for instant tactile response. |
| **Checkbox / Set Check**| `100ms` | Instantaneous toggle | Immediate green fill + subtle badge pop ($\zeta = 0.70$). |
| **Drawer / Sheet Slide** | `400ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Bottom-to-top sheet with backdrop fade. |
| **Screen / Hero Entrance** | `750ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Hero card leads; supporting elements stagger by `60ms`. |
| **Readability Hold** | $\ge 3000\text{ms}$ | Stationary | Any dynamic alert or insight must hold stationary for at least 3 seconds. |

---

## 4. Operational Screen Density & Touch Rules

1. **Vertical Element Ceiling**: Maximum 3 functional elements stacked in a card context (Eyebrow $\rightarrow$ Value/Hero $\rightarrow$ Action).
2. **One Dominant CTA per Viewport**: Exactly one solid primary action button per screen state. All other actions must be outline, ghost, or muted link styling.
3. **Touch Target Floor**: Interactive targets must be $\ge 44 \times 44\text{px}$ with $\ge 8\text{px}$ clearance.
4. **Data Jitter Elimination**: All numeric counters, weights, reps, and timers must specify `font-variant-numeric: tabular-nums` (`.tabular`).
