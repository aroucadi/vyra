# Plan: AI Coach Smart Action Cards & Program Mutation Engine

## Technical Architecture

```
[Trainee in /coach] 
        │
        ▼ (Query / Quick Chip)
[Coach Intent Resolver (coach-engine.ts)] ◄─── Reads [appStore.getActiveProgram]
        │                                 ◄─── Reads [appStore.getLatestWearableBiometrics]
        │                                 ◄─── Reads [appStore.getPersonalBestForExercise]
        ▼
[Smart Action Proposal] 
        │ (Emits Structured Action Payload)
        ▼
[CoachChat Component] ─── Renders ───► [<CoachSmartActionCard />]
        │                                        │
        │                                        ▼ Tap "Apply"
        └─────────────────────────────────► [appStore.swapExercise / condense / recalibrate]
                                                 │
                                                 ▼ Mutates Active Program
                                            [telemetry.track("coach_smart_action_applied")]
                                                 │
                                                 ▼ State Sync
                                            [/session & /today updated instantly]
```

## Implementation Phases
1. **Domain Store Mutations (`src/lib/store.ts`)**:
   - Implement `swapExerciseInActiveProgram`, `condenseActiveProgramDay`, and `recalibrateActiveProgramLoads`.
2. **Coach Engine (`src/lib/coach-engine.ts`)**:
   - Build deterministic, contextual intent resolver linking queries to active program days and Apple Watch biometrics.
3. **Smart Action Card Component (`src/components/coach/CoachSmartActionCard.tsx`)**:
   - Implement strict 3-element UI with single primary CTA, verified confirmation badge, and deep link to `/session`.
4. **Chat Integration (`src/app/(trainee)/coach/page.tsx`)**:
   - Connect `CoachChat` to `coach-engine.ts`, render smart cards inline, and remove mock `alert()` calls.
5. **Quality Verification**:
   - Create unit test suite `tests/unit/lib/coach-smart-cards.test.ts`.
   - Run `npm test` and `npm run build`.
