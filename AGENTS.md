<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Design Philosophy & UI/UX Guardrails

## 1. Negative Constraints (Anti-Clutter & AI-Slop Prevention)
- **Vertical Element Ceiling**: Do not stack more than three elements in a vertical card context (e.g. 1: Category/Eyebrow, 2: Primary Value/Hero Content, 3: Supporting Action/Status).
- **Single Primary CTA per Viewport**: Exactly one dominant visual call-to-action per screen state. All secondary actions must be outline, ghost, or muted link styling.
- **No Unsegmented Monoliths**: Never dump 5+ independent domains, routine trackers, or protocols into a single flat vertical scroll. Structure features using progressive disclosure: segmented tabs, tabbed navigation, collapsible drawers, or distinct screens.
- **Metric Density Cap**: Maximum 3 to 4 metrics per summary card. Never present high-density cognitive overload upfront.
- **Zero Walls of Text**: Operational dashboards must be immediately scannable. Use visual hierarchy, clear typographic weights, and pill badges instead of long descriptive paragraphs.

## 2. Layout, Spacing & Padding Defaults
- **Generous Default Padding**: Always default to generous layout padding (`space-y-6` or `space-y-8`, container padding `p-6` to `p-8` on desktop, `p-4` to `p-6` on mobile).
- **Whitespace is Functional Scaffolding**: Whitespace is intentionally designed breathing room to guide focus and eliminate visual fatigue.
- **Touch Targets**: Minimum 44×44px interactive touch targets with at least 8px spacing between touch elements.

## 3. Component Curation & Minimalist Primitives
- **Design Primitives**: Build on clean, minimalist primitives (Shadcn UI / Radix style) rather than custom, heavily stylized blocks.
- **3-Tier Color Hierarchy**:
  - **60% Neutral Surface**: Obsidian/Slate dark background (`#0B0F17`, `#0F172A`).
  - **30% Structural Contrast**: Dark slate cards (`bg-slate-900/60`), subtle borders (`border-slate-800`), muted typography (`text-slate-400`).
  - **10% Purposeful Accent**: Emerald, Cyan, or Violet reserved strictly for active states, key progress indicators, and primary CTAs.
- **Data & Telemetry**: Always format numbers with `font-variant-numeric: tabular-nums` (`tabular-nums`) to prevent layout jitter.

## 4. Installed Design Intelligence Skills
The following specialized design skills are installed and available in `.agents/skills/` and globally:
- `pencilplaybook`: Perceptual psychology, layout archetypes, and senior design guardrails.
- `ui-ux-pro-max`: Design intelligence database (styles, color palettes, UX guidelines, typography pairings).
- `ui-styling`: Tailwind CSS & Shadcn UI best practice styling patterns.
- `web-design-guidelines`: Vercel Web Interface Guidelines automated design and accessibility auditing.
- `baoyu-design`: Local Claude/Antigravity design agent for mockups, prototypes, and UI specifications.
- `design-system`: Token architecture and 3-layer semantic design tokens.
- `vercel-composition-patterns`: Scalable React 19 composition patterns, avoiding boolean prop proliferation.
- `vercel-react-best-practices`: Next.js & React performance optimization rules.
