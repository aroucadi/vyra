# Tasks: Vyra Adaptive Hypertrophy Wedge

**Input**: Design documents from `specs/007-adaptive-hypertrophy-wedge/`  
**Prerequisites**: `spec.md`, `plan.md`

---

## Task Matrix

- [x] **Phase 1: Planning & Specification**
  - [x] T001: `/plan-ceo-review` 10-star product lock & wedge boundary definitions.
  - [x] T002: `/plan-design-review` anti-slop UI constraints and $\le 3$ element card structure.
  - [x] T003: `/plan-eng-review` heuristics math, state pipeline, and testing architecture.

- [x] **Phase 2: Core Autoregulation Engine**
  - [x] T004: Create `src/lib/autoregulation.ts` with biomechanical heuristics, load down-regulation, and RIR modulation.
  - [x] T005: Create unit test suite `tests/unit/lib/autoregulation.test.ts` verifying all sleep tiers and compound lift dampening.

- [x] **Phase 3: Lean Telemetry Instrumentation Layer**
  - [x] T006: Create `src/lib/telemetry.ts` with non-blocking event dispatch and local testing buffer.
  - [x] T007: Create unit test suite `tests/unit/lib/telemetry.test.ts` verifying activation and retention tracking.

- [x] **Phase 4: Adaptive UI Components & Set Logger Optimization**
  - [x] T008: Create `src/components/trainee/AdaptiveRecalibrationCard.tsx` adhering to $\le 3$ elements and single dominant CTA.
  - [x] T009: Integrate `AdaptiveRecalibrationCard` and autoregulation into `src/app/(trainee)/session/page.tsx`.
  - [x] T010: Ensure the set logger satisfies the 5-second logging speed, tabular numbers, and $\ge 44\times 44$px touch targets.
  - [x] T011: Surface readiness check and recalibration badge in `src/app/(trainee)/today/page.tsx`.

- [x] **Phase 5: Verification & Ship Gate**
  - [x] T012: Run complete test suite (`npm test`) ensuring 100% pass rate.
  - [x] T013: Run production build (`npm run build`) to ensure zero TypeScript, lint, or hydration regressions.
