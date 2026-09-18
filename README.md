# Vyra — Personal Life Optimization Super App ⚡

> **A single, unified life optimization super app unifying high-performance movement, postural architecture, precision fueling, biometric context, personal style, and local experiences.**

[![Cloud Run Live](https://img.shields.io/badge/Google_Cloud_Run-Live_Production-10B981?logo=googlecloud&logoColor=white)](https://newme-app-rqxaakcija-uc.a.run.app)
[![Gemini AI](https://img.shields.io/badge/AI_Engine-Gemini_3.8_Flash-8B5CF6?logo=google&logoColor=white)](https://cloud.google.com/vertex-ai)
[![MuscleWiki API](https://img.shields.io/badge/Biomechanical_DB-MuscleWiki_Integrated-06B6D4)](https://api.musclewiki.com)
[![Tests](https://img.shields.io/badge/Unit_Tests-68%2F68_Passing-10B981)](tests/unit)
[![License](https://img.shields.io/badge/License-Proprietary_Private-slate)](LICENSE)

---

## 🌐 The Vyra Super App Vision

Modern high-achievers manage their lives across fragmented silos: one app for gym sets, another for calories, an interface for blood work, disparate bookmarks for style and posture, and disconnected group chats for local athletic clubs.

**Vyra is the personal life optimization super app**—delivering the depth and polish of a dedicated sports science laboratory with the seamless convenience of a unified daily life OS:

```
                          ┌────────────────────────┐
                          │     VYRA LIFE OS       │
                          │   Personal Super App   │
                          └───────────┬────────────┘
                                      │
     ┌──────────────┬─────────────────┼─────────────────┬──────────────┐
     │              │                 │                 │              │
┌────▼─────┐   ┌────▼─────┐     ┌─────▼──────┐    ┌─────▼─────┐   ┌────▼─────┐
│ Movement │   │ Nutrition│     │  Health &  │    │  Style &  │   │  Local   │
│& Strength│   │ & Fueling│     │ Biometrics │    │  Posture  │   │Athletics │
└──────────┘   └──────────┘     └────────────┘    └───────────┘   └──────────┘
```

1. **Movement & Strength (Active Core)**: 16-Week Periodized Master Transformation, Exercise Confidence Card (ECC) in Stealth Gym Mode, 4-Option Equipment Matrix, and MuscleWiki enrichment.
2. **Nutrition & Fueling (Active Core)**: 8-Milestone Daily Fueling Architecture, phase-based Creatine Saturation protocol, and circadian hydration tracking.
3. **Health & Medical Context**: Biometric tracking (HRV, resting heart rate, recovery state, bloodwork synthesis powered by Gemini 3.8 Flash).
4. **Style & Posture Architecture**: 2:1 pull-to-push biomechanical volume ratio to eliminate upper-cross syndrome and cultivate a distinct athletic V-taper.
5. **Local Experiences & Social**: Curated gym equipment spotlights, crowd meters, and verified training circles.

---

## 🚀 Key Production Features

### 1. Exercise Confidence Card (ECC) & Stealth Gym Mode
Built specifically to eliminate gym intimidation for trainees on the gym floor:
- **5-Second Glance Scan**: Giant visual equipment badge, 3 crisp cues, and zero cognitive load under pressure.
- **Physical Hardware Blueprint**: Visual indicators for commercial machines (seat pin position, chest pad alignment, cable height notches).
- **Grip & Angle Visualizer**: Precise thumb-over vs thumb-under, grip width (shoulder, wide, narrow), and angle (neutral, pronated, supinated).
- **Sensory Burn Calibration**: Tells trainees *exactly* what muscles should burn and what joint sensation signals an improper setup.
- **1-Tap Equipment Swapper**: Instantly switch between Commercial Machine, Dumbbell, Cable, or Bodyweight without breaking flow.

### 2. MuscleWiki Biomechanical Library Integration
- Integrated with MuscleWiki's library of 1,900+ exercises via quota-guarded local caching.
- Seeded with the complete 20-exercise movement pool for Alaa's Blueprint.
- Zero-quota offline fallback engine ensuring development and automated testing never exhaust monthly API ceilings.

### 3. Google Gemini 3.8 Flash AI Intelligence
- Configured with Google Cloud Service Account `vyra-app-sa@vyra-509011.iam.gserviceaccount.com`.
- **Active Biomechanical Feedback**: Real-time analysis of trainee workout struggle notes, generating immediate tactical form fixes and equipment alternatives.
- Configurable model layer defaulting to `gemini-3.8-flash` with zero hardcoding.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + Stitch MCP Dark Slate Design DNA (`#0B0F17`, `#162032`)
- **Cloud Infrastructure**: Google Cloud Run (Containerized Serverless), Artifact Registry, Cloud Build
- **AI / LLM**: Google Cloud Vertex AI & Gemini 3.8 Flash (`vyra-app-sa`)
- **Testing**: Node Test Runner (`node:test`) — 68 passing unit tests across 13 suites

---

## ⚡ Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run test suite (All 13 suites, 68 tests)
npm test

# 3. Start local development server
npm run dev
# -> Open http://localhost:3000
```

### MuscleWiki Migration Script
```bash
# Run quota-guarded MuscleWiki enrichment in dry-run mode
npm run db:enrich-musclewiki

# Apply enrichment to database
npm run db:enrich-musclewiki:apply
```

---

## ☁️ Google Cloud Deployment

Production service is deployed on Google Cloud Run:
- **Live URL**: `https://newme-app-rqxaakcija-uc.a.run.app`
- **GCP Project**: `vyra-509011`
- **Region**: `us-central1`
- **Health Endpoint**: `https://newme-app-rqxaakcija-uc.a.run.app/api/health`

### Deploy via Google Cloud Build:
```bash
gcloud builds submit --config=cloudbuild.yaml .
```

---

## 📄 License & Intellectual Property

Proprietary and Confidential. Copyright © 2026 Vyra (aroucadi). All rights reserved. See [LICENSE](LICENSE) for details.
