# Feature Specification: 016 Anatomical Tension Spotlight & Kinetic Cues

**Feature Branch**: `016-anatomical-tension-spotlight`  
**Created**: 2026-10-14  
**Status**: Specified / Awaiting Approval ("Go")  
**Audit Context**: Screened through `/founder-reality-check`, `/feature-roi-auditor` (ROI: 4.50), `/mvp-police`, `/ui-styling`, and `/web-design-guidelines`.

---

## 1. Executive Summary & Problem Framing (Garry Tan / YC Lens)

### 🪞 The Problem
When a trainee is mid-session or browsing `/library`, tapping on an exercise opens an informational sheet. Currently, this sheet presents textual lists of steps, body parts, and synergists. Under cognitive and physical fatigue in a gym environment:
- Lifters do **not** read 5 paragraphs of generic mechanical prose (*"Sit on bench, grasp bar, lower bar to chest..."*).
- Text descriptions of muscle recruitment (*"Pectoralis Major, Sternal Head, Triceps Brachii"*) lack immediate visceral comprehension.
- The interface feels like an encyclopedia rather than a high-performance athletic instrument.

### 🎯 The Solution: Tactile Biomechanical Tension Spotlight
1. **Micro-SVG Anatomical Tension Spotlight (`<AnatomicalTensionSpotlight />`)**:
   - A compact, highly aesthetic micro-silhouette (approx 48×56px or inline badge) embedded directly alongside the primary exercise metadata.
   - Visually illuminates the primary driver in **Emerald (`#10B981`)** with a subtle ambient pulse, and synergist stabilizers in **Cyan (`#06B6D4`)**.
   - Zero WebGL or canvas dependencies; pure SVG (<2KB gzipped) with 0ms render latency and zero battery drain.
2. **Kinetic Anchors (Setup & Drive Cues)**:
   - Elevated as the primary mental anchors:
     - ⚡ **Setup Anchor**: Spatial foundation (*e.g. "Pins 1 inch above sternum; set scapular retraction"*).
     - 🎯 **Drive Cue**: Kinetic trajectory (*e.g. "Explode off dead-stop pins; drive heels into floor"*).
3. **Segmented Progressive Disclosure**:
   - Tab 1: **Coach Focus** (Micro-spotlight + 2 kinetic anchors + quick plate loader). Zero vertical scroll needed.
   - Tab 2: **Full Protocol** (For beginners needing step-by-step numbered breakdown).
   - Tab 3: **Direct Swaps** (1-tap biomechanical alternatives when gym equipment is occupied).

---

## 2. ROI & Alignment Audit

$$\text{ROI Score} = \frac{\text{Rev}(4) + \text{Learn}(5) + \text{Ret}(5) + \text{Acq}(4)}{\text{Comp}(2) + \text{Risk}(2)} = \frac{18}{4} = \mathbf{4.50} \quad (\ge 2.5 \implies \text{\textbf{APPROVED}})$$

- **Retention Multiplier**: Immediate glanceability during sets increases trainee compliance and eliminates friction.
- **Acquisition / Shareability**: The glowing anatomical spotlight gives Vyra an unmistakable, bespoke cyberpunk/athletic visual identity compared to generic white-card loggers.
- **Zero Third-Party Bloat**: No heavy 3D rendering engines (Three.js/Fiber) or gigabytes of video streaming required.

---

## 3. Component Architecture & Design Token Compliance

Per `AGENTS.md` Design Philosophy:
- **Vertical Element Ceiling**: $\le 3$ elements per visual group (Spotlight + Key Cues + Action).
- **60-30-10 Obsidian Palette**:
  - `60%`: `#0B0F17` Obsidian surface.
  - `30%`: `bg-slate-900/60`, `border-slate-800`, `text-slate-400`.
  - `10%`: Emerald (`#10B981`) for Primary Tension; Cyan (`#06B6D4`) for Synergist Tension.
- **Tabular Numerics**: `font-variant-numeric: tabular-nums` for all weights and rep counts.

```
┌────────────────────────────────────────────────────────┐
│  barbell pin chest press            [ 20kg/side ▾ ]    │
│  Pectoralis Major · Barbell                            │
├──────────────────────────┬─────────────────────────────┤
│  [ MINI SVG SPOTLIGHT ]  │  ⚡ SETUP ANCHOR            │
│       ┌───────┐          │  Pins 1" above sternum.     │
│       │ █ █ █ │ Pectoral │  Dead-stop pause each rep.  │
│       │  [ ]  │ Triceps  │                             │
│       └───────┘          │  🎯 DRIVE CUE               │
│   Primary: Emerald       │  Drive through heels and    │
│   Synergist: Cyan        │  explode through lockout.   │
├──────────────────────────┴─────────────────────────────┤
│  [ Coach Focus ]     [ Full Steps ]     [ Swaps (3) ]  │
└────────────────────────────────────────────────────────┘
```

---

## 4. Acceptance Criteria & Test Scenarios

1. **Scenario 1 - Anatomical Highlight Accuracy**:
   - Given an exercise with target `chest` and synergist `triceps`,
   - When the sheet opens,
   - Then the pectorals render in Emerald (`#10B981`) and triceps render in Cyan (`#06B6D4`), with all non-targeted muscle groups rendered in muted slate (`#334155`).

2. **Scenario 2 - Kinetic Cue Synthesis**:
   - Given an exercise instruction set,
   - When displayed on the Coach Focus tab,
   - Then exactly two high-signal cue cards appear (Setup Anchor and Drive Cue), capped to 2 lines each.

3. **Scenario 3 - Progressive Disclosure**:
   - Full 5-step numbered instructions remain accessible under the secondary tab/drawer without cluttering the initial viewport.

4. **Scenario 4 - Regression & Performance**:
   - Unit test suite passes 100% (245+ tests).
   - Turbopack compilation passes with zero TypeScript warnings.
