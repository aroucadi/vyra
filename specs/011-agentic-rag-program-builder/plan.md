# Implementation Plan: 011 Agentic RAG Program Builder

**Spec Reference**: `specs/011-agentic-rag-program-builder/spec.md`  
**Status**: Ready for Execution  

---

## 1. Phase Breakdown & Execution Steps

### Phase 1: Catalogue Ingestion & Index Pipeline (Deterministic Substrate)
- **Goal**: Ingest OpenGym's 5,632 exercise JSON files into an optimized, typed knowledge index.
- **Deliverables**:
  - `scripts/build-exercise-rag-index.mjs`: Script to parse `openGym/catalogue/exercises/*.json`, normalize anatomical tags, and compile a compact, search-optimized lookup table into `public/data/exercise-rag-index.json`.
  - Type definitions in `src/types/exercise-rag.ts` (`RagExercise`, `ExerciseQueryConstraints`, `BiomechanicalFilter`).

### Phase 2: Biomechanical Retrieval & Constraint Filter Engine
- **Goal**: Implement deterministic pre-filtering and hybrid retrieval without hallucination risk.
- **Deliverables**:
  - `src/lib/rag/exercise-retriever.ts`: Functions for hard constraint masking (equipment availability, injury exclusion, category matching) + scoring by muscle activation (`muscleMap.weights`).
  - Unit tests verifying 100% equipment adherence and muscle targeting precision.

### Phase 3: Agentic Evaluator & Self-Correction Guardrail Loop
- **Goal**: Guarantee industry-grade quality and periodization integrity.
- **Deliverables**:
  - `src/lib/rag/agentic-evaluator.ts`: Eval harness measuring:
    1. 100% Equipment compliance.
    2. Zero hallucinated exercise IDs.
    3. RP Volume landmark adherence (6-22 sets/week).
    4. Structural balance (push-to-pull volume ratio).
  - Test suite with automated eval assertions.

### Phase 4: Integration with Coach Engine & Trainer Program Builder
- **Goal**: Expose the high-standard RAG capabilities directly to the UI.
- **Deliverables**:
  - Connect instant substitution chips in `src/lib/coach-engine.ts` to `exercise-retriever.ts`.
  - Integrate with Gemini 3.8 Flash prompt pipeline in `src/lib/gemini.ts` for AI-assisted mesocycle generation.
