# NewME — AI-Assisted Strength & Nutrition Coaching

NewME is a gym-floor proven, coach-to-trainee platform designed for periodized strength training, supplementation, and hydration protocols.


---

	## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm ci

# 2. Run unit tests (Supplements, Hydration, Health Probe, Program Engine)
npm test

# 3. Start development server
npm run dev
# --> Open http://localhost:3000
```

---

## Feature Highlights

1. **Coach Roster & Compliance Alerts**: Trainer command center with live trainee cards, PR velocity, supplement adherence, and hydration logs.
2. **Interactive Workout Engine**: Live workout session logger with 1RM (Epley formula), PR detection, and rest timers.
3. **Supplement & Hydration Module**: Phase-based protocols (e.g. Creatine loading vs maintenance), hydration tracking with quick-adds, and meal anchoring.
4. **Google Cloud Run Ready**: Health probe at /api/health, standalone multi-stage Dockerfile, error recovery boundaries, and production security headers.

---

## Shipping & Dogfooding to Google Cloud Run

Deploying NewME to Google Cloud Run takes a single command:

### On Windows (PowerShell):
```powershell
./scripts/deploy-cloudrun.ps1 -ProjectId "YOUR_GCP_PROJECT_ID" -Region "us-central1"
```

### On Linux / macOS (& GCP Cloud Shell):
```bash
./scripts/deploy-cloudrun.sh YOUR_GCP_PROJECT_ID
```

### Via Google Cloud Build:
```bash
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/newme-app:latest .
gcloud run deploy newme-app --image gcr.io/YOUR_GCP_PROJECT_ID/newme-app:latest --platform managed --region us-central1 --port 8080 --allow-unauthenticated 
```

---

> Verified with Next.js 16, React 19, 27 passing unit tests, standalone Docker container builds, and complete gStack stabilization.
