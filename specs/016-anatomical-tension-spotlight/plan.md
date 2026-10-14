# Implementation Plan: 016 Anatomical Tension Spotlight & Kinetic Cues

**Branch**: `016-anatomical-tension-spotlight`  
**Dependencies**: `specs/016-anatomical-tension-spotlight/spec.md`  
**Status**: Planned / Awaiting User "Go"

---

## 1. Technical Strategy

### 1.1 Micro-Silhouette Component (`AnatomicalTensionSpotlight.tsx`)
- Create `src/components/trainee/AnatomicalTensionSpotlight.tsx`.
- Compact 56×68px SVG containing stylized anatomical groups (chest, lats, upper back, shoulders, biceps, triceps, quads, hamstrings, glutes, core, calves).
- Accepts:
  ```ts
  interface AnatomicalTensionSpotlightProps {
    primaryMuscle: string;
    secondaryMuscles?: string[];
    className?: string;
  }
  ```
- Normalizes muscle terminology (e.g. "chest", "pectorals", "upper chest" -> `chest`; "lats", "latissimus dorsi" -> `lats`).
- Primary muscle fills with Emerald (`#10B981`) + soft drop-shadow / SVG filter glow.
- Secondary muscles fill with Cyan (`#06B6D4`).
- Inactive groups render with muted slate (`#1E293B` stroke, `#0F172A` fill).

### 1.2 Modal Refactor (`ExerciseDetailSheet.tsx`)
- Refactor the primary tab into a high-density, low-cognitive-load split hero:
  - Left column: `<AnatomicalTensionSpotlight />` with a mini indicator badge.
  - Right column: Kinetic Anchors (Setup & Drive) with high-contrast typography.
- Retain the segmented tabs:
  - `Coach Focus` (Default): Split hero + quick cues + plate loader.
  - `Full Protocol`: 5-step numbered breakdown for full context.
  - `Equipment & Swaps`: Direct equipment-matched substitutes.

### 1.3 Automated Test Coverage
- Create `src/components/trainee/__tests__/AnatomicalTensionSpotlight.test.tsx`:
  - Verifies correct color mapping for primary and synergist muscle groups.
  - Verifies fallback rendering when muscle names are unknown or generalized.
  - Verifies SVG accessibility attributes (aria-label, role="img").

---

## 2. Verification Gates

1. `npm test` -> 100% test pass (245+ existing tests + new spotlight tests).
2. `npx next build` -> zero build or lint errors.
3. Visual sanity test: modal fits within standard mobile viewport (<88vh) without requiring scroll for the core cues.
