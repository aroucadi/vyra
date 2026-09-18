# Feature Specification: Bi-directional Trainee Feedback & RAG-Augmented Adaptive Coaching Engine

**Feature Branch**: `004-ai-feedback-rag-adaptation`  
**Created**: 2026-09-15  
**Status**: Ready for Implementation  
**Priority**: P1 (Core V1 Innovation Pillar)  
**Input**: User request for end-to-end feedback loop allowing trainees to report struggles/stalls/weaknesses, AI RAG analysis of telemetry + profile + biomechanics, actionable formatted synthesis for the trainer, and 1-click trainer-driven adaptive program mutations.

---

## 1. Executive Summary & Vision

Modern fitness apps are one-way broadcast systems: the coach writes a program, the trainee tries to follow it, and when joint discomfort, mechanical stalls, or schedule frictions occur, the athlete either struggles in silence, drops out, or messages the coach on WhatsApp with disconnected context.

NewME's **Bi-directional Feedback & RAG-Augmented Adaptive Coaching Engine** closes this loop:
1. **The Trainee** can frictionlessly flag struggles, joint pinches, or stalls in real time during workouts with quick tags, voice memos, or post-session debriefs.
2. **The RAG Synthesis Engine** joins the athlete's raw feedback with their orthopedic constraints (e.g. Alaa's Anterior Pelvic Tilt, shoulder internal rotation, clinical underweight BMI 16.4), 14–30 day workout telemetry (`SetLog` progression slopes, rep ceilings, RIR achieved), and biomechanical domain rules.
3. **The Certified Trainer** receives a high-density, clinical triage dossier: observed quantitative pattern, root-cause diagnosis, ranked actionable interventions (e.g., 2-week scapular mobility prep block or landmine substitution), and an auto-drafted personalized message.
4. **1-Click Execution**: The trainer reviews a side-by-side interactive program diff, clicks *"Apply & Publish v1.1"*, and the trainee's active program updates instantly with the coach's personalized explanation.

---

## 2. User Scenarios & Acceptance Criteria

### User Story 1 - Trainee Contextual Feedback & Struggle Capture (Priority: P1)

As a trainee performing a scheduled workout, when I struggle with an exercise (e.g. shoulder pinching or plateauing at 15kg without being able to pass 5 reps), I want to record micro-feedback in seconds so my coach understands exactly what happened without interrupting my session flow.

#### Acceptance Scenarios:
1. **In-Session Quick Tagging**: While viewing an exercise card or immediately after logging a set in `/session`, tapping *"Struggling / Feedback"* reveals quick tags:
   - `Weight / Rep Stall`
   - `Joint Pain / Impingement`
   - `Form Breakdown`
   - `Low Energy / Excessive Fatigue`
   - `Equipment Friction`
   - `Felt Easy / RIR > 3`
2. **Multi-Modal Voice & Freeform Input**: Trainee can dictate or type unstructured notes (e.g. *"Shoulder feels pinched in the bottom position of neutral press; couldn't get more than 5 reps on sets 2 and 3"*). Voice recordings are transcribed server-side via Gemini multimodal audio ingestion.
3. **End-of-Session Debrief**: On finishing a workout session, a 20-second modal prompts:
   - Session RPE (1–10)
   - Perceived Mind-Muscle Connection (1–5)
   - Joint Comfort / Pain Flag (Yes/No with targeted joint selector: Shoulders, Lower Back, Knees, Elbows, Hips, None)
   - Optional voice/text note.
4. **Offline Resilience**: If connectivity drops in the gym basement, feedback is stored in IndexedDB and automatically syncs when connectivity is restored.

---

### User Story 2 - RAG Context Pipeline & Biomechanical Synthesis (Priority: P1)

As a system, when trainee feedback is received, I must automatically aggregate multi-dimensional telemetry, query domain sports-science knowledge, and invoke Gemini 3.8 Flash to diagnose the struggle and formulate actionable trainer interventions.

#### Acceptance Scenarios:
1. **Multi-Layered Context Retrieval**: The RAG engine assembles:
   - **Layer A (Athlete Constraints)**: Trainee profile (age 37, height 173cm, weight 49kg, clinical underweight advisory, active injury notes: *Shoulder Internal Rotation*, *Anterior Pelvic Tilt*).
   - **Layer B (Quantitative Performance Telemetry)**: Last 14–30 days of `SetLog` records for that exercise and related movement patterns (e.g., Mon Incline Chest Press vs. Thu Shoulder Press loads, rep trends, achieved RIR).
   - **Layer C (Compliance & Systemic State)**: Rolling 7-day supplement adherence (Creatine loading/maintenance), hydration attainment %, and elapsed rest days.
   - **Layer D (Biomechanical Knowledge Embeddings)**: Scapular plane kinematics (humeral elevation at 30° anterior to coronal plane), subacromial impingement relief, external rotator pre-activation protocols, and double-progression stall criteria (3 consecutive sessions without load progression = fatigue deload or variant swap).
2. **Structured AI Diagnostic Dossier**: Gemini 3.8 Flash outputs a structured `FeedbackAIAnalysis` object containing:
   - **Observed Pattern**: Concrete quantitative evidence without hallucination (e.g. *"Alaa has stalled at 15kg for 3 consecutive weeks, failing to reach the 6-rep floor (5, 5, 4 reps @ 0 RIR). Prior compound pressing volume on Monday has remained constant."*).
   - **Biomechanical Assessment**: Anatomical cause (e.g. *"Subacromial space narrowing during overhead pressing in the presence of documented internal rotation. Likely impingement of supraspinatus tendon leading to reflexive motor inhibition."*).
   - **Ranked Adaptive Interventions**: Exactly 2–3 specific, executable solutions with proposed program mutations.
   - **Draft Coach Communication**: An empathetic, motivating draft message for the coach to send.

---

### User Story 3 - Trainer Triage Console & 1-Click Adaptive Mutation (Priority: P1)

As a certified trainer, I need to see flagged client struggles on my roster, review the AI diagnostic dossier, compare proposed program changes in an interactive diff, and publish adaptations in seconds.

#### Acceptance Scenarios:
1. **Roster Alert Indicators**: Trainees with active feedback/stalls display an alert chip on `/roster` (e.g. *"Alaa: Shoulder Impingement / Stalled Press"*).
2. **Diagnostic Triage Drawer**: Clicking the alert opens the Trainee Feedback Dossier showing:
   - Trainee's raw quote / audio playback.
   - 4-session telemetry sparkline for that exercise.
   - AI Biomechanical Assessment.
   - Ranked Action Proposals:
     - **Option 1 (Targeted Mobility Injection)**: Insert 2-week Scapular Prep & Rotator Warmup Block (Band Face Pulls 2x10 + Scapular Wall Slides 2x10) prior to Thursday pressing.
     - **Option 2 (Exercise Substitution)**: Swap Neutral-Grip DB Shoulder Press for Half-Kneeling Landmine Press (operates in scapular plane with zero impingement).
     - **Option 3 (10% Deload Reset)**: Drop working weight by 10% (13.5kg) for 1 session to flush accumulated fatigue.
3. **Interactive Side-by-Side Diff Preview**: Selecting one or more proposals renders a clear visual diff of the target `ProgramDay` (green additions, red removals, amber modified parameters).
4. **1-Click Apply & Publish v1.1**:
   - Trainer can tweak sets, reps, or notes before publishing.
   - Clicking *"Apply & Publish v1.1"* generates a new program version, archives v1.0, links in-flight historical logs to v1.0, and pushes v1.1 live.
5. **Zero Hallucination / Human-in-the-Loop Gate**: The AI **never** modifies a trainee's program autonomously without explicit trainer authorization.

---

### User Story 4 - Trainee Adaptive Experience & Closing the Loop (Priority: P1)

As a trainee, when my coach adapts my program, I want to see the update immediately on my Today and Program views with the coach's personalized explanation, turning my frustration into athletic progress.

#### Acceptance Scenarios:
1. **Adaptive Update Banner**: On opening `/today` or `/program`, an accent card announces:
   - *"Coach Alaa Pro reviewed your shoulder feedback and updated your Thursday protocol: 2-Week Scapular Prep Block added!"*
2. **Trainer Rationale Card**: Displays the coach's personalized note explaining why the change was made and what sensations to focus on.
3. **Updated Live Session Execution**: During the next Thursday session, the new Scapular Prep warmup block and/or Landmine Press appears seamlessly in sequence with custom form cues and exercise demonstration videos.

---

## 3. Domain Data Entities & Schema Extensions

```typescript
export type FeedbackType =
  | 'exercise_struggle'
  | 'joint_pain'
  | 'plateau'
  | 'energy_fatigue'
  | 'equipment_friction'
  | 'general_note';

export type FeedbackSeverity = 'low' | 'medium' | 'high';

export type FeedbackStatus =
  | 'pending_ai'
  | 'analyzed'
  | 'reviewed_by_trainer'
  | 'action_taken'
  | 'dismissed';

export interface TraineeFeedback {
  id: string;
  traineeId: string;
  trainerId: string;
  programId: string;
  programDayId?: string;
  exercisePrescriptionId?: string;
  sessionId?: string;
  type: FeedbackType;
  severity: FeedbackSeverity;
  tags: string[];
  rawText: string;
  audioMemoUrl?: string;
  status: FeedbackStatus;
  createdAt: string;
}

export interface TrainerActionProposal {
  id: string;
  type: 'exercise_swap' | 'add_warmup_block' | 'deload_load' | 'technique_cue' | 'custom';
  title: string;
  rationale: string;
  targetProgramDayId: string;
  targetSlotIndex?: number;
  proposedChanges: {
    replacementExerciseId?: string;
    replacementExerciseName?: string;
    newWarmupBlock?: any;
    modifiedRepRangeLow?: number;
    modifiedRepRangeHigh?: number;
    modifiedWeightAdjustmentPercent?: number;
    updatedFormCueText?: string;
  };
  status: 'proposed' | 'accepted' | 'modified' | 'rejected';
}

export interface FeedbackAIAnalysis {
  id: string;
  feedbackId: string;
  traineeId: string;
  trainerId: string;
  retrievedContextSummary: {
    recentSetsSummary: string;
    profileInjuries: string[];
    adherenceRate7d: number;
    hydrationAttainment7d: number;
  };
  observedPattern: string;
  biomechanicalRootCause: string;
  recommendedActions: TrainerActionProposal[];
  trainerDraftResponse: string;
  createdAt: string;
}
```

---

## 4. Edge Cases & Safety Guardrails

1. **Acute Pain / Red Flag Symptoms**:
   - If trainee text or voice contains acute injury keywords (*"sharp tearing pain"*, *"pop sound"*, *"numbness down arm"*, *"cannot move arm"*), the system flags **Severity: High**, triggers an urgent medical disclaimer recommending physical medical evaluation, and immediately alerts the trainer console.
   - The AI explicitly refrains from providing medical diagnoses.
2. **Negative Progress Hallucination Guard**:
   - If a trainee claims *"I'm getting weaker on bench press"*, but telemetry shows their estimated 1RM increased from 75kg to 80kg over the last 3 weeks, the RAG engine surfaces the objective telemetry: *"Your estimated 1RM is up +5kg over 21 days; fatigue accumulation may be creating perceived weakness rather than strength loss."*
3. **Non-Destructive Versioning**:
   - All completed workout sessions, sets, and PR records permanently retain their association with the program version under which they were performed. Adapting a program never overwrites or corrupts past workout logs.
4. **Human Trainer Supremacy**:
   - The AI operates strictly as an expert diagnostic assistant to the certified trainer. No program modifications are published without explicit trainer review and confirmation.
