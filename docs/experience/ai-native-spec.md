# VYRA Autonomous Biomechanical Engine — AI-Native Layer & Intelligent UI Specification

> **Benchmark**: AI-Native Generative UI Architecture (Next.js 16 / React 19 / Gemini 3.8 Flash)  
> **Status**: Shipped & Verified in Production (Specs 004, 010, 011, 015, 017)  
> **Target Surfaces**: In-Gym Interactive Canvas (`/session`, `/coach`, `/today`, `/program/new`)

---

## 1. Executive Summary & Design Benchmark

Vyra rejects the naive "AI chatbot bubble with markdown text" paradigm. On a loud, fast-moving gym floor, reading paragraphs of generative text is unacceptable. Vyra treats model-composed interfaces as **generative, interactive applications where the intelligence parameterizes, filters, and arranges vetted, typed UI components**.

### Core Intelligent UI Principles:
1. **Model Parameterizes, System Guarantees**: The model selects components exclusively from a closed, strictly typed component registry (`CoachSmartActionCard`, `SubstitutionCopilotDrawer`, `AdaptiveRecalibrationCard`).
2. **Deterministic Fallbacks**: Every generative interface is backed by pure TypeScript math engines (`coach-engine.ts`, `src/lib/training-math/`). If the network drops or API latency spikes, the system falls back instantaneously to deterministic rules with zero downtime.
3. **Progressive Streaming Without Layout Shift (Zero CLS)**: Structural containers reserve layout boundaries with skeleton placeholders matching final component aspect ratios.
4. **Interactive Action Loop**: Tapping interactive controls within a model-rendered card directly mutates the active program in `appStore` with live optimistic UI and provides an immediate 1-tap Undo.

---

## 2. Closed Component Registry & Schemas

The AI-native layer operates strictly on allow-listed action card schemas defined across `src/lib/coach-engine.ts` and rendered by `<CoachSmartActionCard />`:

```typescript
export type SmartCardType =
  | "exercise_swap"      // Replace occupied or impinging exercise with equipment alternative
  | "workout_condense"   // Compress session to 30-40 min (cull auxiliary sets while preserving anchors)
  | "load_autoregulate"  // Buffer axial compound loads by 5-10% on elevated CNS fatigue or low sleep
  | "sleep_explanation"  // Transparent biometric recovery reasoning card
  | "load_explanation";  // Progressive overload justification backed by stall-streak math

export interface CoachSmartActionCardData {
  type: SmartCardType;
  title: string;
  badge: string;
  explanation: string;
  dataPoints: Array<{ label: string; value: string }>;
  actionLabel?: string;
  actionPayload?: {
    action: "SWAP_EXERCISE" | "CONDENSE_WORKOUT" | "AUTOREGULATE_LOAD";
    targetExerciseName?: string;
    newExerciseName?: string;
    targetDurationMinutes?: number;
    loadFactor?: number;
    rirDelta?: number;
  };
  appliedMessage?: string;
}
```

### Full AI-Native Component Suite:
1. **`<CoachSmartActionCard />`** (`src/components/coach/CoachSmartActionCard.tsx`):
   - Renders 3-element actionable mutation cards in coach chat and `/today` insights.
   - Enforces the vertical element ceiling ($\le 3$ elements) with single primary CTA.
2. **`AgenticRagProgramBuilder`** (`src/lib/gemini.ts` / `/program/new`):
   - Generates complete 16-week periodized mesocycles conforming to Renaissance Periodization (RP) hypertrophy volume landmarks (MEV–MRV 10–20 sets/muscle/week).
   - Enforces deterministic pre-retrieval filtering: masks 6,554-exercise catalogue by equipment availability and orthopedic safety flags (e.g. automatically excludes behind-the-neck presses when shoulder impingement is flagged).
   - Validates generated JSON schemas via Zod before applying to store.
3. **`<SubstitutionCopilotDrawer />`** (`src/components/trainee/SubstitutionCopilotDrawer.tsx`):
   - Driven by `src/lib/training-math/substitution-copilot.ts` and `/api/substitutions`.
   - Muscular subdivision matching (e.g. clavicular vs sternal pec, iliac lat vs upper lat).
   - Resistance curve alignment (lengthened overload, shortened peak, constant resistance).
4. **`<IntelligentPostureDiagnosis />` & `<StructuralBalanceRadar />`** (`src/components/trainee/StructuralBalanceRadar.tsx` / `/posture`):
   - Evaluates athlete strength ratios against Poliquin, Thibaudeau, and ATG benchmark ratios.
   - Flags joint vulnerabilities (e.g. Anterior Shoulder Impingement risk when internal rotators overpower external rotators) and injects 1-tap corrective isolation protocols.

---

## 3. When to Use Model-Composed Interfaces vs. Fixed Native UI

| Scenario | Interface Type | Rationale |
|:---|:---|:---|
| **Biometric Autoregulation Proposal** | **Interactive Smart Action Card** | Exposes HRV, sleep duration, and load delta with 1-tap "Apply 10% Buffer" button. |
| **Occupied Gym Equipment Swap** | **`<SubstitutionCopilotDrawer />`** | Visual matrix of equipment alternatives with coach rationale and 1-tap in-session mutation. |
| **Session Condensation (Lunch Break)** | **Diff & Plan Card** | Displays removed accessory sets vs preserved primary compounds with 1-tap "Condense". |
| **Technique & Form Anchor Cue** | **Two Kinetic Anchors (Text)** | Concise typographic cues (<10 words each) for zero cognitive overhead during lift. |
| **Gym Floor Set Logging** | **Fixed Native Steppers (`Log`)** | Repeated core loop requires muscle memory and sub-second execution ($\le$ 5s). |

---

## 4. Trust, Safety & Athletic Guardrails

1. **Deterministic Reasoning ("Why?")**:
   - Every card explicitly details its factual trigger (e.g. *"HRV 48ms is 14% below your 7-day baseline (56ms). Axial loading buffered to protect lumbar fatigue."*).
2. **Pure Math Guarantees**:
   - 1RM estimations, plate calculations, progression steps, and structural ratios are executed by pure TypeScript algorithms (`src/lib/training-math/`), never hallucinated by an LLM.
3. **Reversibility & 1-Tap Undo**:
   - Applying any automated mutation displays an immediate success banner with an active Undo button that restores previous program or session state in <2ms.
4. **Athletic Load-Capacity Guardrails**:
   - Rather than relying on clinical medical jargon or diagnosis, Vyra enforces sports science recovery limits:
     - Volume ceiling safeguards (capping weekly muscle group sets at MRV $\le 22$ sets).
     - Spinal loading thresholds (down-regulating axial barbell squats/deadlifts to supported machines during systemic CNS fatigue).
     - Minimum recovery buffers (forcing 48h rest between high-intensity compound splits for the same movement vector).
