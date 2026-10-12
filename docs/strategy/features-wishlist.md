# VYRA Post-Wedge Wishlist & Future Backlog

> **Document Status**: Strategic Architecture Backlog  
> **Origin**: Deprioritized & decoupled during the single-user Wedge hardening sprint (V1 Wedge: Train logger, 1-tap readiness adaptation, supplement checklist, meso-cycle calendar).  
> **Guiding Principle**: Do not pull items from this backlog into active development until the core wedge achieves consistent usage and validated retention from lifter #1 (Alaa) and lifter #2.

---

## 1. Backlog Matrix & Gate Criteria

| Domain | Feature Area | Deprioritization Rationale | Required Gate to Re-open | Est. Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Telemetry** | Apple HealthKit / Health Auto Export | Requires native wrapper or third-party webhooks; high schema maintenance; manual 1-tap sleep prompt suffices. | 30 continuous workout sessions logged; user requests automated recovery ingest. | Medium |
| **Telemetry** | Oura & Whoop Webhook Ingestion | High third-party API drift; OAuth2 account token refresh handling; potential latency. | Verified demand for continuous overnight HRV / resting heart rate auto-scoring. | Medium |
| **Architecture** | Life Hub (Five-Pillar Dashboard) | Multi-pillar surface distracted from workout execution; high cognitive load; diluted wedge focus. | Core Train pillar retention established (>80% weekly adherence over 8 weeks). | Large |
| **Intelligence** | Freeform Physiological AI Coach | Open-ended chat creates hallucination risk, token costs, and in-gym friction vs instant deterministic chips. | Lifter requests custom training block periodization or natural-language query support. | Large |
| **Pillar: Sleep** | Restorative Sleep Architecture | Premature without validated sleep data source; static advice caused user distrust. | Continuous wearable data pipeline or daily protocol check-in consistency. | Medium |
| **Pillar: Style** | Aesthetic & Posture Ergonomics | Zero crossover with in-gym training wedge; diluted brand credibility during launch. | Posture/mobility routine integration requested after fundamental strength cycle. | Low |
| **Pillar: Network** | Athletic Circles & Local Venues | Social features before single-player utility creates empty ghost-town networks. | 10+ active local lifters using VYRA independently. | High |
| **Cloud & Sync** | Server-side Database (Firestore / Postgres) | Client-side IndexedDB + offline write queue solved immediate zero-friction gym logging. | Lifter uses >1 device (e.g., iPhone in gym, iPad/Mac desktop at home). | Medium |
| **Delivery** | Native iOS App (Capacitor / Swift) | PWA via Safari / Chrome on iOS meets install and offline requirements without App Store review friction. | Requirement for Background Sync API or true CoreBluetooth hardware access. | High |

---

## 2. Feature Specifications

### 2.1 Devices Telemetry & Automated Biometrics Ingestion
- **Objective**: Replace manual 1-tap readiness questions ("Under 5 h", "6 h", "7 h", "8 h or more") with continuous passive wearable signals.
- **Components**:
  1. **Apple HealthKit Sync**:
     - Integration via HealthKit native bridge or automated daily export (Health Auto Export webhook to `/api/webhooks/biometrics`).
     - Data points: Sleep duration, time in deep sleep (NREM), resting heart rate (RHR), and overnight Heart Rate Variability (rMSSD).
  2. **Oura Ring & Whoop Integration**:
     - OAuth2 integration with Oura API v2 (`/v2/usercollection/sleep`, `/v2/usercollection/daily_readiness`) and Whoop API.
     - Auto-recalibration hook: When overnight recovery score drops below baseline threshold, automatically calculate fatigue penalty factor ($F_p$) and suggest volume adjustments.
- **Privacy & Safety Constraints**:
  - Telemetry payload must never expose personal health details in client-side URLs or telemetry logs.
  - Transparent formula: Always show calculation factors in the "Why?" adaptation drawer.

---

### 2.2 Reintroduction of Life Hub (Multi-Pillar Architecture)
- **Objective**: Re-introduce broader holistic optimization once training adherence is rock-solid.
- **Architecture Contract**:
  - Maintain the existing typed contract in code (`Moment`, `Signal`, `Insight`) without coupling to the Train UI.
  - Segregate into progressive disclosure tabs or secondary views rather than a single monolithic vertical scroll.
- **Pillars**:
  1. **Sleep Architecture**:
     - Chronotype scheduling (ideal sleep/wake window).
     - Evening wind-down checklists (magnesium glycinate timing, screen cut-off).
  2. **Style & Structural Posture**:
     - Thoracic extension and cervical alignment reminders.
     - V-taper structural progression tracking (bi-monthly shoulder-to-waist ratio photos stored locally).
  3. **Athletic Network & Venues**:
     - Training spot reviews (equipment inventory: calibrated plates, monolifts, specialized bars).
     - Curated lifting partners with matching training schedules.

---

### 2.3 Conversational AI Training Copilot
- **Objective**: Provide contextual assistance for exercise substitutions and periodization questions.
- **Execution Strategy**:
  - **Replaces**: Generic open-ended chat with context-aware, bounded training assistant.
  - **Context Grounding**: Assistant receives current session context (exercise name, target RIR, previous session logs, current fatigue inputs) via system prompt injection.
  - **Fast Execution**: Stream responses using Google Gemini 3.8 Flash for sub-second latency.
  - **Quick Action Chips**:
    - *"Substitute exercise (equipment occupied)"*
    - *"Niggle in shoulder (recommend warm-up adjustment or variation)"*
    - *"Running out of time (compress session to 30 mins with supersets)"*

---

### 2.4 Cloud Persistence & Multi-Device Real-time Sync
- **Objective**: Transition from client-centric IndexedDB storage to cloud persistence.
- **Components**:
  1. **Backend Database**:
     - Cloud Firestore or Supabase PostgreSQL with Row Level Security (RLS).
     - Per-user document structure: `users/{userId}/sessions`, `users/{userId}/programs`, `users/{userId}/readiness`.
  2. **Authentication Gate**:
     - Server-side sessions using Firebase Auth (email magic links or Google One-Tap).
     - httpOnly, Secure, SameSite session cookies validated in Next.js middleware.
  3. **Two-Way Synchronization Engine**:
     - Write-ahead offline queue on IndexedDB with client-generated UUIDs for idempotent retries.
     - Background sync upon window foregrounding and network `online` events.
     - Visual indicator: Quiet "Saved" or "Syncing..." status pill.

---

### 2.5 Native Hardware Capabilities & Push Notifications
- **Objective**: Access platform features currently limited in iOS Safari/PWA environments.
- **Components**:
  1. **True Haptic Feedback**:
     - Native Taptic Engine integration (via Capacitor `@capacitor/haptics`) for rest timer completion and PR (Personal Record) notifications.
  2. **Web Push & Rest Timer Notifications**:
     - Web Push API with VAPID keys for workout reminders and rest interval countdowns when app is minimized.
  3. **Live Activities (iOS)**:
     - Real-time Dynamic Island and Lock Screen workout widgets displaying current set, exercise, and ticking rest timer.
