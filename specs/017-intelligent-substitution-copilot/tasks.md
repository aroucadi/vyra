# Task List: 017 Intelligent Biomechanical Substitution Copilot

- [ ] **Task 1: Spec & ROI Validation** (Completed)
  - [x] Problem framing & YC reality check
  - [x] ROI scoring (5.67 / 5.0)
  - [x] Coordinate with Spec 016 (zero conflict)

- [ ] **Task 2: Core Biomechanical Matching Engine** (Awaiting Go)
  - [ ] Implement `src/lib/training-math/substitution-copilot.ts`
  - [ ] Add resistance curve & angle matching matrix
  - [ ] Write unit test suite `tests/unit/lib/substitution-copilot.test.ts`

- [ ] **Task 3: Build `<SubstitutionCopilotDrawer />` Component** (Awaiting Go)
  - [ ] Render 3 ranked alternatives adhering to 3-element card ceiling
  - [ ] Display 1-sentence deterministic coach rationale
  - [ ] Provide 44x44px 1-tap "Swap" CTA

- [ ] **Task 4: Session & Catalogue Integration** (Awaiting Go)
  - [ ] Connect into `/session` active workout blocks
  - [ ] Connect into `/exercises` catalogue sheet
  - [ ] Full regression test suite (`npm test`, `npx next build`)
