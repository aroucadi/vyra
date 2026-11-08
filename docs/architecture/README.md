# VYRA System Architecture & Engineering Documentation

Welcome to the technical architecture and solution design documentation for **VYRA**, the physical-first athletic operating system.

---

## Documents in this Section

- **[System Architecture & Solution Design](./system-architecture-and-solution-design.md):** The comprehensive architectural blueprint covering the Flight Recorder model, late-binding sovereignty, append-only event sourcing, hybrid storage economics, and zero-cognition gym floor ergonomics.

---

## Architectural Highlights

```mermaid
flowchart LR
    A["Physical Source of Truth\n(Gym Floor: Punch Lissasfa)"] -->|"< 2ms 1-Tap Logging"| B["Flight Recorder\n(Local IndexedDB Event Stream)"]
    B -->|"Late-Binding Anchor"| C["Sovereign Vault\n(Passkey / Google)"]
    C -->|"Asynchronous Batch Sync"| D["Cloud Observer\n(Firestore + GCS Archive)"]
    D -->|"Executive Debrief"| E["Coach Marcus Roster\n(Zero Overhead Telemetry)"]
```

### Quick Reference
1. **Physical First:** The barbell and nervous system are the source of truth. The phone is a hardened flight recorder.
2. **Zero-Block Auth:** Never block an athlete before lifting. Sovereign local identity on boot; late-binding Passkey/Google anchor on completion.
3. **Immutable Events:** Typos create compensation events (`SET_AMENDED`), not destructive database overwrites.
4. **80px HIT TARGET:** 90% of sets logged with 1 tap under 160+ bpm heart rates.
5. **Hybrid Storage:** Browser memory (< 2ms) $\to$ Firestore Native Hot ($\$0.00$ base) $\to$ GCS Brotli Cold Vault ($\$0.002$/mo).
