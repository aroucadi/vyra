# VYRA Life OS — AI-Native Experience Layer & Intelligent UI Specification

> **Benchmark**: OpenAI Intelligent UI (GPT-6, October 2026 Reference Architecture)  
> **Status**: Verified & Implemented in VYRA Life OS  
> **Target Surfaces**: In-App Interactive Canvas (`/coach`, `/session`, `/today`) + ChatGPT Host / Wearable Embeddings

---

## 1. Executive Summary & Design Benchmark

In accordance with Section 10.0 of the Universal Experience Reinvention charter, VYRA treats model-composed interfaces not as chat bubbles with markdown text, but as **generative, interactive applications where the model parameterizes and arranges vetted, typed components**.

### The Intelligent UI Paradigm
1. **Model Composes, System Guarantees**: The model selects components from a closed, strictly typed registry (`CoachSmartActionCard`, `ExerciseCard`, `VolumeChart`, `TimelineMoment`).
2. **Deterministic Fallbacks**: Every generative interface is backed by a deterministic, rules-based engine (`coach-engine.ts`) ensuring 100% availability even when the model is offline, rate-limited, or encountering latency.
3. **Progressive Streaming Without Layout Shift (Zero CLS)**: Structural containers reserve layout boundaries with skeleton placeholders matching final component aspect ratios.
4. **Interactive Action Loop**: Tapping interactive buttons within a model-rendered card directly mutates the active program in `appStore` with live optimistic UI and provides an immediate 1-tap Undo.

---

## 2. Closed Component Registry & Schemas

The AI-native layer operates exclusively on allow-listed action card schemas defined in [`src/lib/coach-engine.ts`](file:///d:/rouca/DVM/workPlace/NewMe/src/lib/coach-engine.ts) and rendered by [`CoachSmartActionCard`](file:///d:/rouca/DVM/workPlace/NewMe/src/components/coach/CoachSmartActionCard.tsx):

```typescript
export type SmartCardType =
  | "exercise_swap"      // Replace exercise with equipment alternative
  | "workout_condense"   // Compress session to 30 min (drop auxiliary sets)
  | "load_autoregulate"  // Buffer loads by 10% on low HRV/sleep
  | "sleep_explanation"  // Transparent biometric reasoning card
  | "load_explanation";  // Progressive overload justification

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

---

## 3. When to Use Model-Composed Interfaces vs. Fixed Text

| Scenario | Interface Type | Rationale |
| :--- | :--- | :--- |
| **Explaining Biometric Load Adjustment** | **Interactive Smart Action Card** | Exposes HRV, sleep score, and load delta with a 1-tap "Apply 10% Buffer" button. |
| **Exercise Substitution Under Time Crunch** | **Interactive Comparison Card** | Shows equipment setup, target reps, and 1-tap "Confirm Swap" into active program. |
| **Session Condensation (30m lunch break)** | **Diff & Plan Card** | Displays removed sets vs. preserved primary sets with 1-tap "Condense Program". |
| **Simple Form Cue / Technique Question** | **Plain Text (1-2 sentences)** | Immediate cognitive absorption without unnecessary UI widgets. |
| **Active Gym Floor Set Logging** | **Fixed Native Steppers (`Log`)** | Repeated core loop requires muscle memory and sub-second speed ($\le$ 5s). |

---

## 4. Trust, Safety & Ethics Guardrails

1. **Why? on Every Suggestion**: Every card includes its factual justification (e.g. *"HRV 48 ms is 15% below your 7-day baseline of 56 ms"*).
2. **Formula & Computation in Code**: All 1RM estimations, tonnage calculations, and caloric allocations are computed via deterministic TypeScript functions (`calculateEstimated1RM`, `deriveDayTimeline`), never guessed by an LLM.
3. **Reversibility & Undo**: Applying any mutation displays a success confirmation with an active Undo affordance.
4. **Clinical Health Warning**: Prominent underweight medical guidance (BMI 16.4 advisory) is persisted on athlete profiles and never overridden by automated algorithms.
