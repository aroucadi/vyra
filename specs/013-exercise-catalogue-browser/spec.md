# Feature Specification: 013 Exercise Catalogue Visual Browser & Biomechanical Drawer

**Feature Branch**: `013-exercise-catalogue-browser`  
**Created**: 2026-10-14  
**Status**: Approved / In-Development  
**Audit Context**: Screened through `/founder-reality-check`, `/feature-roi-auditor` (ROI: 4.25), `/mvp-police`, `/pricing-strategy-architect`, and `/ui-styling`.

---

## 1. Executive Summary & Multi-Lens Audit Justification

### 🪞 Founder Reality Check Audit
- **Evaluated Addition**: Full visual browsing UI for the 6,554-exercise catalogue ingested from OpenGym, with muscle/equipment filters, gym shorthand instant search, and a detailed exercise inspection drawer.
- **Evidence Tier**: **Tier 3 (Hard Proof)**. Trainees and trainers require immediate lookup when equipment is occupied in real gyms, needing sub-second muscle-targeted substitutes with clear biomechanical steps.
- **Bias Avoided**: Zero heavy 3D rendering or bespoke media servers. Leverages client-side inverted token search (<1ms) and lightweight animated SVG/WebP vector previews with zero cloud storage bloat.

### 📈 Feature ROI Audit
$$\text{ROI Score} = \frac{\text{Rev}(4) + \text{Learn}(4) + \text{Ret}(5) + \text{Acq}(4)}{\text{Comp}(2) + \text{Risk}(2)} = \frac{17}{4} = \mathbf{4.25} \quad (\ge 2.5 \implies \text{\textbf{APPROVED}})$$
- **Retention Driver**: Instant exercise discovery and machine substitution prevent gym dropouts and workout abandonment.
- **Monetization Trigger**: Pro feature gating indicator for automated progression and structural balance ratios directly surfaced within the exercise inspection drawer.

### 👮 MVP Police & YC Scrapper Decision
- **Verdict**: **APPROVED FOR ZERO-DEPENDENCY CLIENT CODE**.
- Uses pre-compiled in-memory index (`src/lib/rag/exercise-search.ts`) and native React UI components conforming to Vyra's UI Guardrails (max 3 vertical elements per card, 44x44px touch targets, 60-30-10 Obsidian dark aesthetic).

---

## 2. User Scenarios & Prioritized User Stories

### User Story 1 - Instant Exercise Search & Gym Shorthand Filtering (Priority: P1)
**As a** Trainee standing at the gym rack,  
**When** I type "db inc bench" or "rdl" into the search bar,  
**I want** results returned in under 10ms with typo tolerance and category pills,  
**So that** I don't waste rest time typing full academic movement names.

**Acceptance Scenarios**:
1. **Given** the `/exercises` page is loaded, **When** searching for `ohp`, **Then** movements like "Barbell Overhead Press" and "Dumbbell Overhead Press" appear first.
2. **Given** a search with minor typos (e.g., `bicepp`), **Then** Damerau-Levenshtein typo tolerance correctly suggests bicep curl movements.

---

### User Story 2 - Biomechanical Filter Matrix: Muscle & Equipment (Priority: P1)
**As a** Trainee or Coach planning substitutions,  
**When** I select "Chest" and "Dumbbell",  
**I want** the list filtered instantly to matching exercises with primary vs secondary muscle breakdowns,  
**So that** I can pick an exact biomechanical match for an occupied machine.

**Acceptance Scenarios**:
1. **Given** muscle filter "Lats", **When** active, **Then** all vertical and horizontal pulling movements targeting lats are displayed.
2. **Given** an equipment filter "Cables", **When** active alongside "Chest", **Then** cable crossovers and cable presses are surfaced.

---

### User Story 3 - Detailed Exercise Sheet & Biomechanical Breakdown (Priority: P2)
**As a** Trainee wanting form cues,  
**When** I tap any exercise card,  
**I want** a slide-up sheet showing step-by-step instructions, primary/secondary muscles, female/male variants, and plate loading breakdown,  
**So that** I can execute the exercise safely with optimal biomechanical alignment.

**Acceptance Scenarios**:
1. **Given** an exercise card tapped, **Then** a Sheet opens containing:
   - Category and equipment badge
   - Step-by-step numbered instructions
   - Primary and secondary muscle targets
   - Quick "Substitute This" action
