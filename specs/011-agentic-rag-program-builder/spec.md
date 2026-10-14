# Feature Specification: 011 Agentic RAG Program Builder & Biomechanical Knowledge Engine

**Feature Branch**: `011-agentic-rag-program-builder`  
**Created**: 2026-10-13  
**Status**: Approved / Draft  
**Scope Context**: Vyra Core Wedge Hardening + Advanced RAG Knowledge Architecture  

---

## 1. Executive Summary & Philosophy

Naive RAG (simple vector similarity search on unconstrained text embeddings) fails catastrophically in athletic and medical domains because:
1. It ignores hard physiological constraints (joint impingements, axial spine fatigue, prior injuries).
2. It hallucinates unavailable gym equipment.
3. It fails periodization rules (volume landmarks, antagonist push-to-pull ratios, structural balance).

This specification defines an **Industry-Standard Agentic RAG Architecture** for Vyra, powered by:
- The **5,632 exercise OpenGym Catalogue** as a structured, normalized biomechanical knowledge substrate.
- **Deterministic Pre-Retrieval Filtering**: Hard-masking by equipment inventory, joint impingement safety bounds, and user experience level.
- **Hybrid Search**: Dense semantic vector embeddings (Gemini text-embedding) + BM25 keyword matching on anatomical target muscles and movement patterns.
- **Biomechanical Re-Ranking & Self-Correction (Agentic Evaluation Loop)**: Validating candidate movements against Charles Poliquin & ATG structural balance ratios, total weekly set volume caps (RP Hypertrophy landmarks), and equipment availability before presentation to the Trainer.
- **Deterministic Fallback**: Instant offline/local capability for in-gym swaps when connectivity is degraded.

---

## 2. User Scenarios & Prioritized User Stories

### User Story 1 - Deterministic In-Gym Movement Substitution (Priority: P1)
**As a** Trainee in the gym using the mobile PWA,  
**When** a piece of equipment is occupied or an acute joint niggle occurs,  
**I want** an instant, biomechanically identical alternative from the 5,600+ catalogue,  
**So that** my workout momentum is preserved without waiting for LLM roundtrips or hallucinated machine setups.

**Independent Test**:  
Triggering "Substitute exercise" on Barbell Incline Bench Press with "Dumbbells Only" filter returns Incline Dumbbell Press with exact target muscle matching (`chest.upper`) and appropriate load translation within < 50ms.

**Acceptance Scenarios**:
1. **Given** a session with Barbell Flat Bench Press, **When** trainee selects "Dumbbell only substitute", **Then** the system filters catalogue items requiring `barbell`, matches `target: pectorals`, and returns Dumbbell Flat Bench Press.
2. **Given** a trainee with an active shoulder impingement flag, **When** requesting a vertical press substitute, **Then** the retrieval pipeline filters out behind-the-neck or wide-grip overhead pressing in favor of neutral-grip dumbbell overhead pressing or landmine presses.

---

### User Story 2 - Agentic RAG Program Builder for Trainers (Priority: P2)
**As a** Certified Personal Trainer on the Vyra desktop console,  
**When** designing a multi-week periodized program for a trainee with specific equipment constraints and goals,  
**I want** an AI Program Assistant that drafts a compliant 4-to-8 week mesocycle,  
**So that** I spend minutes adjusting an evidence-based draft rather than hours copying spreadsheets.

**Independent Test**:  
Trainer inputs: *"4-day Upper/Lower hypertrophy block for an intermediate lifter with lower back fatigue; home gym (dumbbells, pull-up bar, adjustable bench)"*. Gemini + Agentic RAG generates a structured `Program` object matching Vyra domain entities, respecting axial deloading and volume landmarks.

**Acceptance Scenarios**:
1. **Given** trainee equipment inventory `[dumbbell, pull-up bar, bench]`, **When** the Agentic RAG generates Day 1 (Upper), **Then** zero exercises requiring cables or barbells are included.
2. **Given** an intermediate lifter profile, **When** the Agentic evaluator runs, **Then** weekly direct sets per muscle group fall strictly between 10 and 20 sets (Renaissance Periodization MEV-MRV boundaries).

---

### User Story 3 - Biomechanical Ratio & Structural Balance Auditing (Priority: P3)
**As a** Coach or Lifter reviewing an active mesocycle,  
**When** inspecting programmed volume distribution,  
**I want** an automated structural balance audit using clinical lifting ratios,  
**So that** postural imbalances and chronic overuse injuries are caught before they occur.

**Independent Test**:  
Run `evaluateStructuralRatio()` over the programmed volume to verify that horizontal push volume is balanced by antagonist horizontal/vertical pull volume (Poliquin ~88% ratio).

---

## 3. High-Standard Agentic RAG Architecture

```mermaid
flowchart TD
    subgraph KnowledgeSubstrate["1. Knowledge Ingestion & Indexing"]
        OG[5,632 OpenGym JSON Exercises] --> Normalizer[Normalizer & Attribute Extractor]
        Normalizer --> AttrIndex[Attribute Inverted Index: equipment, target, bodyPart]
        Normalizer --> TextChunk[Biomechanical Markdown Representation]
        TextChunk --> Embedder[Gemini Embedding API / Local TF-IDF]
        Embedder --> VectorStore[(IndexedDB / Cloud Vector Store)]
    end

    subgraph AgenticPipeline["2. Multi-Stage Agentic RAG Pipeline"]
        Query[Trainer/Trainee Query] --> Router[Agent Query Classifier]
        Router --> PreFilter[Stage 1: Deterministic Hard Filter (Equipment, Injury)]
        PreFilter --> HybridRetrieval[Stage 2: Hybrid Retrieval (Dense Vector + BM25)]
        HybridRetrieval --> Candidates[Top 20 Candidate Exercises]
        Candidates --> ReRanker[Stage 3: Biomechanical Re-Ranker (Structural Balance & Synergy)]
        ReRanker --> ContextAssembler[Stage 4: Grounded Context Injection]
        ContextAssembler --> Generator[Stage 5: Gemini 3.8 Flash Structured Generator]
        Generator --> Draft[Draft Program / Exercise Prescription]
    end

    subgraph EvalGate["3. Evaluation & Guardrail Gate (Evals)"]
        Draft --> Critic[Agentic Critic / Schema Validator]
        Critic -->|Constraint Violation| SelfCorrect[Self-Correction Prompt Loop (Max 2)]
        SelfCorrect --> Generator
        Critic -->|All Evals Passed| TrainerConsole[Trainer Roster / Trainee App]
    end
```

---

## 4. Evaluation Framework & Quality Guardrails (Evals)

To satisfy production-grade, enterprise AI standards, every generated program or exercise prescription MUST pass three automated deterministic evaluation assertions:

1. **Equipment Compliance Rate**:
   $$\text{Compliance} = \frac{\text{Prescribed Exercises with Owned Equipment}}{\text{Total Prescribed Exercises}} = 100\%$$
   *Any score below 100% halts generation and triggers immediate self-correction.*

2. **Volume Landmark Sanity (RP Hypertrophy Bounds)**:
   - Minimum Effective Volume (MEV): $\ge 6\text{ sets/muscle/week}$
   - Maximum Recoverable Volume (MRV): $\le 22\text{ sets/muscle/week}$

3. **Structural Balance Coherence**:
   - Push-to-Pull set volume ratio must remain between $0.85$ and $1.15$ to protect anterior shoulder posture.

4. **Biomechanical Hallucination Check**:
   - Every `exerciseId` in the generated JSON MUST resolve to a real entity in the indexed catalogue. Zero synthetic IDs permitted.

---

## 5. Technical Requirements

- **FR-011-1**: System MUST provide an offline-capable catalogue index (`exercise-catalogue.json`) generated from the 5,632 openGym catalogue records.
- **FR-011-2**: System MUST implement a deterministic pre-filter function `filterExercisesByConstraints(equipment[], injuries[], category)`.
- **FR-011-3**: System MUST implement a hybrid ranker combining anatomical muscle weightings (`muscleMap.weights`) and query semantic intent.
- **FR-011-4**: System MUST inject structural balance checks (`structural-balance.ts`) as a post-generation validation step.
- **FR-011-5**: System MUST maintain sub-second response times for deterministic exercise swaps and stream AI program drafts via Gemini 3.8 Flash.
