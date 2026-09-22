# VYRA Life OS — Information Architecture & Navigation

## 1. Top-Level Shell & The 4 Navigation Tabs

The app uses a 4-tab bottom navigation bar for mobile web/PWA:

```
[ Today ]          [ Coach ]          [ Life ]          [ You ]
Timeline anchor    AI concierge       5 pillar rooms    Progress & settings
```

### Strict Navigation Rules:
1. **No "Log Session" Tab**: Logging is what happens when the user taps **Start** on the Today hero.
2. **No "Program" Tab**: The training program lives inside `Life` $\rightarrow$ `Train` $\rightarrow$ `Program` and is reachable directly from the Today workout card.
3. **Hidden Developer / Role Switcher**: Removed entirely from the public UI. Accessible solely via long-press on the version number in `You` $\rightarrow$ `Developer Settings`.
4. **Full-Screen Immersive Gym Mode**: When entering `Active Workout`, the bottom tab bar is completely hidden to eliminate accidental navigation. A clear, deliberate exit button ("Exit Session") is pinned to the header.

---

## 2. Screen Hierarchy & Flows

```
Today (Root Timeline)
  ├── Tap Workout Hero ──────────> Session Preview (Exercises, targets, time)
  │                                   └── Tap "Start" ──> Active Workout (Full-Screen, 1 exercise at a time)
  │                                                           ├── Tips Sheet (Drawer: cues, video, load strategy)
  │                                                           └── Finish ──> Session Summary (PR celebration, Done)
  ├── Tap Supplement Moment ──────> Supplement Stack Drawer (Morning / Workout / Evening checklist)
  └── Tap Insight "Why?" ─────────> Coach Drawer (Contextual explanation & action)

Coach (Tab 2)
  └── Contextual AI Assistant with chips: [Swap Exercise] [Why this weight?] [Short on time]

Life (Tab 3)
  ├── Train (Active Room) ───────> Program (7-day calendar strip), Exercise Library, PR History
  ├── Eat (Supplements Active) ──> Full Daily Supplement Prescriptions & Hydration
  ├── Sleep (Locked Tile) ───────> "Coming soon" with 1-line promise & notify toggle
  ├── Style (Locked Tile) ───────> "Coming soon" with 1-line promise
  └── Network (Locked Tile) ─────> "Coming soon" with 1-line promise

You (Tab 4)
  ├── Body Metrics & PR Trends
  ├── Workout History Archive
  ├── Settings & Preferences
  └── Developer Menu (Hidden: Role/Persona switcher & database reset)
```

---

## 3. The 5 Composable Primitives

Every screen in VYRA is strictly constructed using five compound components built on accessible Radix primitives:

1. **`Card`**:
   - `Card.Glance`: Eyebrow + title + single status line.
   - `Card.Action`: Exactly one primary interactive button or trigger.
   - `Card.Learn`: Trigger for non-blocking bottom Sheet/Drawer containing deep details.
2. **`Check-in`**:
   - One-tap confirm primitive for binary or state logging (Supplements, Readiness, Hydration increments).
   - Pre-filled with smart defaults.
3. **`Log`**:
   - Numeric input primitive with steppers (`-`, `+`) and a prominent confirm button.
   - Pre-filled with previous session's weight and reps.
4. **`Insight`**:
   - Single-sentence cross-pillar observation with an optional "Why?" link opening the Coach.
   - Maximum 1 visible per screen.
5. **`Plan`**:
   - Time-ordered sequence of moments (Today's vertical timeline or the 7-day program week strip).

---

## 4. Extensibility Contract (Code & Types)

Pillars publish moments and signals through a typed interface. New pillars (Sleep, Style, Network) plug in without modifying the core `Today` screen implementation:

```typescript
export type PillarId = "train" | "eat" | "sleep" | "style" | "network";

export interface Moment {
  id: string;
  pillar: PillarId;
  time: string; // "12:15"
  title: string;
  glance: string; // "6 exercises · ~55 min"
  status: "past" | "now" | "upcoming";
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  learnHref?: string;
}

export interface Signal {
  pillar: PillarId;
  type: string; // "sleep.duration", "train.load", "nutrition.hydration"
  value: number | string | boolean;
  timestamp: string;
}

export interface Insight {
  id: string;
  sources: PillarId[]; // e.g. ["sleep", "train"]
  sentence: string; // "Slept 5h, so today's session is capped at 2 RIR."
  confidence: number;
  whyPrompt?: string;
}
```
