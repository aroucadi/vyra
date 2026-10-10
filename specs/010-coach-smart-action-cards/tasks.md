# Tasks: AI Coach Smart Action Cards & Program Mutation

- [x] **Phase 1: Domain Mutation Methods in Store**
  - [x] T001: Implement `swapExerciseInActiveProgram` in `src/lib/store.ts`.
  - [x] T002: Implement `condenseActiveProgramDay` in `src/lib/store.ts`.
  - [x] T003: Implement `recalibrateActiveProgramLoads` in `src/lib/store.ts`.

- [x] **Phase 2: Coach Contextual Intent Engine**
  - [x] T004: Create `src/lib/coach-engine.ts` with biometrics and program-aware resolution.

- [x] **Phase 3: Coach Smart Action Card Component**
  - [x] T005: Create `src/components/coach/CoachSmartActionCard.tsx` adhering to $\le 3$ elements and single CTA.

- [x] **Phase 4: Coach Page Integration**
  - [x] T006: Refactor `src/app/(trainee)/coach/page.tsx` to use `resolveCoachQuery`, inline cards, and eliminate `alert()` mocks.

- [ ] **Phase 5: Automated Testing & Cloud Deployment**
  - [x] T007: Create unit test suite `tests/unit/lib/coach-smart-cards.test.ts`.
  - [x] T008: Verify 100% test pass rate (`npm test` - 98/98 passing).
  - [x] T009: Verify Next.js production build (`npm run build`).
  - [ ] T010: Deploy updated container to Google Cloud Run (`vyra-app`).
