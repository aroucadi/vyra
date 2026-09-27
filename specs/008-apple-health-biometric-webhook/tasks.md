# Tasks: Lightweight Apple Health Biometrics Webhook

**Input**: Design documents from `specs/008-apple-health-biometric-webhook/`  
**Prerequisites**: `spec.md`, `plan.md`

---

## Task Matrix

- [x] **Phase 1: Domain & Store Foundations**
  - [x] T001: Add `WearableBiometricSnapshot` and `InboundBiometricsPayload` to `src/lib/types.ts`.
  - [x] T002: Add `biometricSnapshots` state and `saveWearableBiometrics` / `getLatestWearableBiometrics` to `src/lib/store.ts`.

- [x] **Phase 2: Autoregulation Enhancement with HRV & Deep Sleep**
  - [x] T003: Extend `src/lib/autoregulation.ts` to factor in `hrvMs`, `deepSleepMinutes`, and `restingHeartRateBpm` into the readiness score and headline diagnostics.

- [x] **Phase 3: Webhook Endpoint Implementation**
  - [x] T004: Create `src/app/api/webhooks/biometrics/route.ts` with validation, auth secret protection, store persistence, and telemetry dispatch.

- [x] **Phase 4: UI Hydration (Today & Workout Preview)**
  - [x] T005: Update `src/app/(trainee)/session/page.tsx` to automatically hydrate from the latest synced wearable snapshot and display the Apple Watch badge.
  - [x] T006: Update `src/app/(trainee)/today/page.tsx` to show live wearable sync status on the readiness chip.

- [x] **Phase 5: Verification & Quality Gate**
  - [x] T007: Write unit test suite `tests/unit/lib/biometrics-webhook.test.ts`.
  - [x] T008: Run full test suite (`npm test`) ensuring 100% pass rate (90/90 passing).
  - [x] T009: Run production build (`npm run build`) ensuring zero TypeScript or routing regressions.
