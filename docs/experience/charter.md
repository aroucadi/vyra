# VYRA Life OS — Experience Charter

## 1. Product Vision

**VYRA Life OS is a life "super app"** in the spirit of WeChat or X: one everyday companion that helps an ambitious individual be *super well* across five pillars:

1. **Sleep well** (Rest & Circadian Balance)
2. **Eat well** (Nutrition & Supplements)
3. **Train well** (Fitness, Movement & Strength)
4. **Dress well** (Style, Postural Fit & Scapular Alignment)
5. **Network well** (Social, Partner Training & Local Radar)

Fitness/training is the first pillar shipped in full. Everything designed and built today serves as a clean, extensible architectural shell that the other four pillars plug into without structural redesign.

### Why WeChat and X Succeed at Scale Without Clutter
In Western apps, multi-feature apps often devolve into a chaotic "Franken-app" with overwhelming dashboards and competing CTAs. X and WeChat avoid this because:
- **One Anchor**: Every capability enters through a single primary anchor (X: the feed, WeChat: the chat, VYRA: the **Day Timeline**).
- **Same Primitives**: Every feature uses identical interaction and logging patterns.
- **Contextual Relevance**: Information appears only when relevant to the user's immediate moment.

### The North Star
> *"Open the app, know exactly what to do next for a great day, do it in seconds, feel better for it."*

---

## 2. Experience Foundation

### 2.1 The Anchor: The Day
The atomic unit of VYRA is **the Day**, not the feature. Home is a calm, single chronological timeline of moments:
$$\text{Wake} \longrightarrow \text{Supplements} \longrightarrow \text{Breakfast} \longrightarrow \text{Train} \longrightarrow \text{Outfit} \longrightarrow \text{Wind-down} \longrightarrow \text{Sleep}$$

Each pillar contributes *moments* to the timeline rather than owning a dedicated home-screen widget or card. The app consistently and quietly answers one question: **"What's next for me?"**

### 2.2 The Three Feeling Words (Evaluative Rubric)
Every UI element, button, label, and interaction is judged against these three words. If it does not serve one, it is eliminated:
- **Calm**: Low density, generous whitespace, quiet transitions, zero visual screaming.
- **Capable**: Fast, unambiguous, always knows the optimal next step, never forces the user to think about navigation or configuration.
- **Personal**: Adapts to user state and biometrics, remembers preferences, speaks briefly like a world-class concierge.

### 2.3 Anti-Goals (What VYRA Must Never Be)
- ❌ **Not a Dashboard / Control Panel**: No dense metric walls, no monospace hacker labels (e.g. `OPTIMAL_LOAD_STATE_V2`), no raw float telemetry.
- ❌ **Not a Feature Menu**: No grid of 20 icons competing for attention on the home screen.
- ❌ **Not a Nagging Coach**: No guilt-tripping, no streak-shaming, no notification floods.
- ❌ **Not a Demo Sandbox**: No persona switchers, IDs, or developer tools in the user-facing product.

### 2.4 Voice & Tone
- **Short, warm, direct.**
- **Verbs first.**
- **Maximum ~12 words per line of guidance.**
- **Never robotic, never hype.**

| Context | What We Avoid | VYRA Tone |
|---|---|---|
| Ready for workout | "Workout Session #14: Hypertrophy Split ready for execution." | "Ready when you are." |
| Short sleep | "Sleep deprivation detected! Reducing prescribed tonnage by 18.5%." | "Slept 5h, so today's lighter." |
| Progressive overload | "Target achieved. Progressive overload algorithm indicates weight increment." | "Add 2.5 kg next time." |
