# Feature ROI Audit & Anti-Bloat Slaughter

> **Directive Source**: Phase 2 of Founder Operating System (`feature-roi-auditor`, `mvp-police`, `yc-mvp-scrapper`).  
> **Evaluation Formula**:
> $$\text{ROI Score} = \frac{\text{Revenue (1-5)} + \text{Retention (1-5)} + \text{Acquisition (1-5)} + \text{Learning (1-5)}}{\text{Complexity (1-5)} + \text{Risk (1-5)}}$$

---

## 🧮 Comprehensive Feature Evaluation Matrix

| Feature Scope | Rev | Ret | Acq | Lrn | Cpx | Rsk | ROI Score | Status | Verdict & Remediation |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **5-Second Set Logger w/ Smart Defaults** | 3 | 5 | 3 | 4 | 2 | 1 | **5.00** | 🟢 **GREEN** | **Approved Core Utility**: Keep ultra-fast; pre-fill previous session's weight/reps; zero lag. |
| **Daily Supplement & Protocol Checklist** | 3 | 4 | 2 | 3 | 1 | 1 | **6.00** | 🟢 **GREEN** | **Approved Habit Hook**: Minimal checkbox state; keeps D1–D7 retention active on non-lifting days. |
| **Adaptive Volume Recalibration Engine** | 5 | 5 | 4 | 5 | 2 | 2 | **4.75** | 🟢 **GREEN** | **The Unbeatable Wedge**: Modulates sets/reps/RIR dynamically based on sleep/fatigue inputs. |
| **16-Week Program Meso-Cycle Calendar** | 4 | 4 | 3 | 3 | 2 | 1 | **4.67** | 🟢 **GREEN** | **Approved Retention Spine**: Shows scheduled progressive overload and planned deloads. |
| **Freeform AI Conversational Chatbot** | 2 | 2 | 2 | 2 | 4 | 4 | **1.00** | 🔴 **KILLED** | **Slop / Liability Trap**: Lifters do not want to text a bot during a workout. Replace with 1-tap adaptation chips. |
| **Sleep Pillar (Wearable API Integration)** | 2 | 2 | 2 | 2 | 5 | 4 | **0.89** | 🔴 **KILLED** | **Premature Over-Engineering**: Do not write Oura/Whoop sync yet. Replace with a 1-tap manual readiness prompt. |
| **Style & Wardrobe Pillar** | 1 | 1 | 1 | 1 | 5 | 5 | **0.40** | 🔴 **KILLED** | **Toxic Distraction**: Completely alienates serious lifters; zero ICP crossover; destroys brand credibility. |
| **Network & Rolodex Pillar** | 1 | 1 | 1 | 1 | 4 | 5 | **0.44** | 🔴 **KILLED** | **Toxic Distraction**: Fails the concierge test; zero demand; zero willingness to pay. |

---

## 🚨 MVP Police & YC Scrapper Enforcement Orders

### 1. Enforcement on Multi-Pillar Architecture (Sleep, Style, Network)
* **Status**: 🚫 **IMPLEMENTATION BLOCKED**
* **Finding**: Building wearable SDK integrations or fashion/networking models before the training logger reaches 20% D30 retention is an existential founder trap.
* **Preserved Structure**: Keep the UI tiles as locked/disabled status pills (`"Unlocks at Level 2"`) or omit entirely from the active viewport. **Zero engineering time, zero APIs, zero databases.**

### 2. Enforcement on the "AI Coach"
* **Status**: 🚫 **OPEN-ENDED CHAT ENGINE BLOCKED**
* **Finding**: Unstructured LLM chat introduces latency, high token cost, prompt drift, and legal risk (e.g. hallucinating unsafe loading instructions).
* **Lean Replacement**: Deterministic rule-based or single-prompt heuristic engine:
  $$\text{Target Weight} = \text{Planned Weight} \times (1 - \text{Fatigue Penalty})$$
  Provides immediate, crisp, and predictable workout adjustments in $< 50$ms without API roundtrips.

---

## 🟢 The Greenlit Core Wedge (Build Scope)

Only **four features** are permitted into the active production pipeline:
1. **The Train Logger**: Clean, tabular set logging with pre-filled previous load and automatic rest countdown.
2. **Adaptive Recalibration Card**: 1-tap adjustment when sleep/recovery is sub-optimal.
3. **Supplement Protocol Checklist**: Morning, Intra, and Post-Workout check-offs.
4. **Meso-Cycle Calendar**: High-level block tracker keeping the lifter oriented in their 16-week progression.
