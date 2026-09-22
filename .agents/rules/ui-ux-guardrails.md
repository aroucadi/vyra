# UI/UX Design Guardrails & Anti-Clutter Rules

These rules are strictly enforced across all frontend code generation, UI redesigns, and component engineering in this project. They prevent cognitive exhaustion, visual overcrowding, and "averaged-out AI slop".

---

## 1. Negative Constraints (Strict Guardrails)
- **Vertical Element Ceiling**: Do not stack more than three elements in a vertical card context (e.g. Header/Label, Main Value/Hero Metric, Supporting Action/Detail).
- **Single Primary CTA per Viewport**: Every screen or section must have exactly ONE dominant call-to-action button. Secondary actions must be ghost, outline, or muted subtle triggers.
- **No Unsegmented Feature Dumps**: Never dump multiple separate functional domains, sub-features, or routine trackers into a single scrolling wall. Use progressive disclosure: segmented controls, pill tabs, modal drawers, or collapsible accordions.
- **Metric Density Cap**: Summary stat cards must not contain more than 3-4 metrics. If additional telemetry exists, place it behind a dedicated drill-down or tab.
- **Zero Walls of Text**: Never output dense paragraphs in operational dashboards. Chunk information into scannable hierarchical blocks with clear typography (`text-xs uppercase tracking-wider` for labels, large tabular numbers for metrics).

---

## 2. Generous Spacing & Layout Padding Defaults
- **Generous Gaps**: Default to generous layout padding and spacing:
  - Page-level vertical stack: `space-y-6` or `space-y-8` (`gap-6` / `gap-8`).
  - Card internal padding: `p-5` or `p-6` on mobile, `p-6` to `p-8` on desktop.
  - Form control & item lists: minimum `gap-3` to `gap-4`.
- **Whitespace is Functional Scaffolding**: Whitespace is not dead space. It provides perceptual breathing room and guides the eye through visual hierarchy.
- **Touch Targets**: Minimum interactive touch target is 44×44px with at least 8px separation between adjacent interactive elements.

---

## 3. Component Curation & Minimalist Primitives
- **Use Clean Minimalist Primitives**: Standardize on Shadcn UI / Radix primitives (`Button`, `Card`, `Badge`, `Tabs`, `Dialog`, `Progress`) rather than custom, heavily stylized, competing visual blocks.
- **3-Tier Color Rule**:
  - **60% Neutral Surface**: Obsidian/Slate dark background (`#0B0F17`, `#0F172A`) or clean light canvas.
  - **30% Structural Contrast**: Subtle frosted border (`border-slate-800`), deep card fill (`bg-slate-900/60`), muted supporting text (`text-slate-400`).
  - **10% Purposeful Accent**: Electric Emerald, Cyan, or Indigo reserved strictly for active states, key progress indicators, and primary CTAs.
- **Data & Numeric Display**: Always use `font-variant-numeric: tabular-nums` (`tabular-nums` in Tailwind) for countdowns, timers, weights, reps, and metrics to eliminate visual jitter.

---

## 4. Vercel Web Interface & Accessibility Guidelines
- **Semantic HTML**: Always use `<button>` for actions and `<Link>`/`<a>` for page navigation. Never use `<div onClick>`.
- **Icon Buttons**: Every icon-only button must include an `aria-label`.
- **Focus Rings**: Never remove outline without replacement. Always supply `focus-visible:ring-2 focus-visible:ring-emerald-500/50`.
- **Accessible Contrast**: Maintain minimum 4.5:1 text contrast. Avoid low-contrast gray-on-gray body text.
- **Headings**: Use `text-wrap: balance` or `text-pretty` on titles to eliminate awkward typographical widows.
