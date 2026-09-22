# VYRA Life OS — The Ideal Day Map

The `Today` screen is built around a single chronological timeline of moments. The current moment is expanded as the **Hero**, past moments collapse into subtle checked ticks, and upcoming moments rest as single quiet rows.

---

## 1. Chronological Timeline of Moments

| Time Window | Moment | Pillar | Primary Action ($\le$ 10s) | Cross-Pillar Insight Example |
|:---|:---|:---|:---|:---|
| **06:30 – 07:00** | Wake & Readiness Check | Sleep | Confirm readiness score (pre-filled) | *"Slept 7h 20m. Good to go."* |
| **07:00** | Creatine + Mineral Hydration | Nutrition | 1 tap to check | — |
| **08:00** | Morning Stack (D3/K2, Omega-3, B-Complex) | Nutrition | 1 tap "Morning Stack" | — |
| **09:00** | Breakfast Fueling | Nutrition | Confirm planned meal | *"High protein to support today's chest volume."* |
| **12:15** | Daily Workout (Upper Hypertrophy) | Train | **Start** $\rightarrow$ Log sets in full-screen | *"Sleep was short: cap at 2 RIR today."* |
| **13:30** | Post-Workout Fuel & Shake | Nutrition | 1 tap confirm | *"Heavy session: +30g post-workout carbs."* |
| **15:00** | Style / Afternoon Transition | Style | Accept suggested look | *"Rain + gym commute: lightweight shell."* |
| **18:30** | Network / Partner Alignment | Network | Acknowledge / reply | *"Marcus logged the same chest split today."* |
| **21:30** | Evening Wind-Down & Magnesium | Sleep/Nutrition | 1 tap to check stack | *"Lights out by 23:00 preserves tomorrow's readiness."* |
| **23:00** | Sleep Restoration Anchor | Sleep | Automatic | — |

---

## 2. Timeline Interaction States

```
[ 07:00 ]  ✓  Mineral Hydration · 500 ml                       (Collapsed Past Moment)
[ 08:00 ]  ✓  Morning Stack · 3 micronutrients                 (Collapsed Past Moment)
--------------------------------------------------------------------------------------
[ NOW   ]  ⚡  Upper Hypertrophy: Chest & Posture Pull          (EXPANDED HERO MOMENT)
               6 exercises · ~55 min · 4 sets incline press
               [ START WORKOUT ] (Primary Dominant Action)
               "Slept 7h20m. Ready for full volume." (Insight)
--------------------------------------------------------------------------------------
[ 13:30 ]  ○  Recovery Shake · 40g Protein + 5g Creatine       (Quiet Upcoming Row)
[ 21:30 ]  ○  Evening Magnesium Glycinate                      (Quiet Upcoming Row)
```

### Visual Rules for Timeline Moments
1. **Past Moments**: Rendered as simple one-line muted rows with a green check tick. Tapping expands details if review is needed.
2. **Current Moment (Hero)**: Dominant visual focus. Occupies the visual center of the viewport with a high-contrast primary CTA.
3. **Upcoming Moments**: Clean, single-line slate items indicating scheduled time and action title.
