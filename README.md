# Vyra — Personal Life Optimization Super App ⚡

> **A single, unified life optimization super app unifying high-performance movement, postural architecture, precision fueling, biometric context, personal style, and local experiences.**

[![Cloud Run Live](https://img.shields.io/badge/Google_Cloud_Run-Live_Production-10B981?logo=googlecloud&logoColor=white)](https://vyra-app-rqxaakcija-uc.a.run.app)
[![Gemini AI](https://img.shields.io/badge/AI_Engine-Gemini_3.8_Flash-8B5CF6?logo=google&logoColor=white)](https://cloud.google.com/vertex-ai)
[![MuscleWiki API](https://img.shields.io/badge/Biomechanical_DB-MuscleWiki_Integrated-06B6D4)](https://api.musclewiki.com)
[![Tests](https://img.shields.io/badge/Unit_Tests-76%2F76_Passing-10B981)](tests/unit)
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

## 🎨 Stitch MCP Super App UI/UX Design Architecture

Vyra’s user experience is designed using **Stitch MCP** under the *Quiet Luxury & Precision Biomechanics* design system:

| # | Screen | Design Objective & Features | High-Res Stitch Preview |
| :-: | :--- | :--- | :--- |
| **01** | **Executive Mobile HUD** | The single command center: 94% Peak Life State badge, 5-Pillar Daily Resonance Strip, Phase 2 Upper Hypertrophy hero card, and Gemini voice assistant. | [View Screen](https://lh3.googleusercontent.com/aida/AEtjO1UqibSbtzkcjUfKGFw1mlYmShXK9cb_53k8I7iqTKePqDMFyUroGLaAEQGnbAbuUqo-iLMfJ7c6HBe9WKa0gVfY12u5bB4dDvWqTLyr72f6gfNTRRb1qg_RDwI-bHG3zowDB3hP9minbWKP9PgOhj0QPm2i_riMCfBA71GL5eT0RndApSuVGOocgxswYPAYUtHP9vsFLh25kQDXKRTdkDyVmjf15x75kLcwUtbdmjYvGAY1Jy_6w_cYV8I) |
| **02** | **Train Well (Live Gym Telemetry)** | Exercise Confidence Card (ECC) in Stealth Gym Mode, 5-second hardware pin blueprint, 4-equipment swapper, sensory burn gauge, and tactile set logger. | [View Screen](https://lh3.googleusercontent.com/aida/AEtjO1VNyuGI5Ocx-wUCHqgxfEY2fuQrxRSjhgKtGCqZtoXhuYRDYjCTyPU-_lbNlC9Iz6lBb5Z5tltqTx6yfz1NOSDjEEqudxN3DwJhgjTCNsaPTfuqqbfGfGS6TFLqpQEvv0pHKVd2nqyU3aC1gmV0BZWBeCYI8NMRALTqJG_AKtnBfu_z-ufRHoAVEKW4EhFKdzLqli9Mx4FNtXpcb5C1YKDpcwqZnJmDgk_krbMTFiBqd9mFZod_kQAXHTU) |
| **03** | **Eat Well (Circadian Fueling)** | 8-Milestone nutrient timing timeline, active post-workout creatine saturation window, and blood biomarker integration (Glucose 84, hs-CRP 0.4, Test 740). | [View Screen](https://lh3.googleusercontent.com/aida/AEtjO1W4I6aYIcweFG0mQlqmbXMe9nqqCVNgJ1JOjt3qOJvlyBmGl100CPTOJgRBhUwi6mjxiw2Qef9gaC3HCghz0TxmatYdABrn3wblGlGB2Wa24I1VA16IMXoydEU7W8FaJQcdAMC32mPB4weW0wqONpCN8fNRXrxWXMSK961a9vPlT1okpB_CNHQ-n9SELlsy44iwPFfc1ULRVd8bfzpHMLmFH40jln3uXPaGMHffaZobatOC4bu405Jxz6M) |
| **04** | **Wear Well (Style Architecture)** | 1.54 V-taper ratio, 96% neutral scapular posture sensor, today's AI look "The Executive Athletic Minimalist", and digital closet matrix. | [View Screen](https://lh3.googleusercontent.com/aida/AEtjO1U6BPqUmEnKpHSLPTC50vs0iOXEDY3jxxg4Ta9VFmk8ECchweMzJLkv5UIX1MOl7uNyg-yc2uY_YEqMfktf77Ope7xsIBER91kF6V3SA94zn6VKuRN108VjDBMmjb_dh4g5y9N6hkW05LqjXTS6SuMBjA600HponrWOp0jRwBMgJQNZsxJtuB2XSDYVwPFR1Q9DZyiypA6R_vyHIO2RoGvwPb8PJjZ3pNi3OuGdGG4mevL7FheIqrlljQ) |
| **05** | **Meet & Network Well** | 91% social energy battery, peak charisma window (6:00-9:30 PM), Marina Sunset 8k athletic run & founders circle, and live gym crowd radar. | [View Screen](https://lh3.googleusercontent.com/aida/AEtjO1U7xRk193YusO-IWCj66-43Z7v0tLs8UHJE9UGiDjza_AR0ar8_3hve_oEj57QZG0G0d-S22ObN4vpWhzo17e7O8Y1wGKsugQkIr8KVMdJo08ebn4cvLiXQ4kO0Cq22Fbyd_H6317ZWiLcxX_0tL0w6fuVBfgY7_9T_QGVEdBdKW6V7I2mpw5Nh8nWcacDMMtI90_PcJt-fKH--Zkf2zP4f5hf1GInWBQa6R-POe7uNezgrTqDp-AiAof0) |
| **06** | **Sleep & Restore Well** | 94% Restorative Depth score, Stage 3 NREM deep sleep (2h 14m), HRV 82ms, circadian light/adenosine curve, smart mattress cooling, and NSDR induction. | [View Screen](https://lh3.googleusercontent.com/aida/AEtjO1Wp8HV_6FiM8U10xuvHE_vvB2EyBKd6owKPzuKzsLIcGLqDESOjKkv0iozCANDcY8DgLvuCqzniG1U9QWzAEs4va9A0IXjeiXU85BWg4QhN4PjDB1MRQHcUn2bZiU_g4u98MpbinIsprOHSEJJHTGRUJTuqAIjicRWCIhgcqPzEpvjVqkwoNAKCzcqyzPEJEWNfURpvgTPzXaPsYQYaHfDTCDj4meXNmXzfogDXusJsa6wHZRDeIK6byQ) |

> Complete design spec and architectural breakdown: [specs/006-vyra-super-app-design/spec.md](specs/006-vyra-super-app-design/spec.md)

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
- **Live URL**: `https://vyra-app-rqxaakcija-uc.a.run.app`
- **GCP Project**: `vyra-509011`
- **Region**: `us-central1`
- **Health Endpoint**: `https://vyra-app-rqxaakcija-uc.a.run.app/api/health`

### Deploy via Google Cloud Build:
```bash
gcloud builds submit --config=cloudbuild.yaml .
```

---

## 📄 License & Intellectual Property

Proprietary and Confidential. Copyright © 2026 Vyra (aroucadi). All rights reserved. See [LICENSE](LICENSE) for details.
