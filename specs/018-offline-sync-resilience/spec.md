# Feature Specification: 018 Offline Sync & Resilience Hardening

**Feature Branch**: `018-offline-sync-resilience`  
**Created**: 2026-10-14  
**Audit Context**: Screened through `/cso` (STRIDE Threat Model), `/review` (Staff Engineer Edge Cases), `/founder-reality-check`, and `AGENTS.md`.

---

## 1. Executive Summary & Threat Model (CSO / Staff Eng Lens)

### 🪞 The In-Gym Threat Scenario
A trainee enters a basement gym, converted metal warehouse, or underground commercial facility with **zero cellular connectivity and no Wi-Fi**.

Under this environment:
1. **Threat 1 (Tab / Memory Eviction)**:
   - Trainee rests 2-3 minutes between heavy sets. They lock their phone or switch to music.
   - iOS WebKit / Android Chrome purges background tab memory to free RAM.
   - When the trainee unlocks phone, the tab reloads. In memory-only architectures, **sets 1 and 2 are permanently lost**. Trainee uninstalls the app in frustration.
2. **Threat 2 (Offline Mutation Drop)**:
   - Trainee finishes the workout and taps "Finish Workout".
   - The app tries an unhandled `fetch()` to Server Actions / REST endpoints. The request fails with `TypeError: Failed to fetch`.
   - If not buffered, the workout log is dropped or hangs indefinitely on a loading spinner.
3. **Threat 3 (Cold Catalogue Lookup)**:
   - Trainee wants to search an alternative exercise or view form cues while offline.
   - If the catalogue or API requires network access, search returns an empty screen.

---

## 2. Hardening Protocols & Mitigation Architecture

### 🛡️ Protocol A: Instant Set-Level Draft Journaling (`< 2ms`)
- Every time a set is logged (weight, reps, RIR), the active session snapshot is immediately written to an IndexedDB store (`session_drafts`) and mirrored in `localStorage`.
- Upon mounting `/session`, if an unfinalized draft exists from the last 4 hours, it is **restored automatically**.
- When the workout is successfully completed or intentionally discarded, the draft is cleared.

### 🛡️ Protocol B: Replay Mutation Sync Queue with Exponential Backoff
- When mutations (e.g., `save_session`, `log_readiness`, `log_biometrics`) cannot reach the server, they are queued locally in `mutation_queue` with:
  ```ts
  interface QueuedMutation {
    id: string;
    type: 'save_session' | 'log_readiness' | 'log_metric';
    payload: any;
    attempts: number;
    maxAttempts: number;
    queuedAt: string;
    nextRetryAt: number;
  }
  ```
- **Sync Triggers**:
  - `window.addEventListener('online')`
  - `window.addEventListener('focus')`
  - Periodic background drain (with exponential backoff `2^attempts * 1000ms + jitter`).

### 🛡️ Protocol C: Full Offline Movement Index & Service Worker Precaching
- `public/sw.js` pre-caches `/exercises` and `/data/exercise-catalogue.json`.
- `/api/exercises` and `/api/substitutions` leverage a Cache-First / Stale-While-Revalidate strategy so search queries and copilot alternatives respond in `< 5ms` with zero signal.

---

## 3. CSO Security Audit & OWASP / STRIDE Compliance

| Threat | Risk Category | Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Identity / Session | Sync queue payloads carry verified `traineeId` and session UUIDs matching client store. |
| **Tampering** | Data Integrity | Offline set logs carry monotonic timestamps and sequence indices. Corrupt payloads rejected by `migrateLegacyStoredData`. |
| **Information Disclosure** | Privacy Leak | Zero PII or medical data stored in plain text outside the client database. |
| **Denial of Service** | Server Flooding | Replay queue caps retries at 5 attempts with jittered exponential backoff. Maximum queue depth of 50 items. |

---

## 4. Acceptance Criteria

- [ ] Every set logged in `/session` updates the persistent draft within 5ms.
- [ ] Simulating a browser crash/reload restores all completed sets without loss.
- [ ] Completing a workout in Airplane Mode succeeds with zero UI lag, storing the session locally with `syncStatus: "pending"`.
- [ ] Toggling network back online automatically drains the mutation queue and syncs to the server.
- [ ] `/exercises` search and `/api/substitutions` function 100% offline via pre-cached JSON and service worker.
