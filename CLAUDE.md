@AGENTS.md

# Senior Frontend & UI/UX Guardrails

## Negative Constraints
- Do not stack more than three elements in a vertical card context.
- Single primary CTA per viewport; secondary buttons must be subtle/outline/ghost.
- Never dump multiple separate life domains/feature sets into a single unsegmented page. Use progressive disclosure (tabs, segmented controls, drill-down modals).
- Maximum 3-4 metrics per summary card.

## Layout & Padding Defaults
- Always default to generous layout padding (e.g. `space-y-6` or `gap-8` in Tailwind CSS, `p-6` card padding).
- Minimum 44×44px touch targets.
- Value whitespace as functional cognitive scaffolding.

## Component Curation
- Utilize clean, minimalistic primitives (Shadcn UI / Radix style guides) rather than custom, heavily stylized blocks.
- Strict 60-30-10 color balance (60% dark obsidian background, 30% slate surface cards, 10% purposeful accent).
- Tabular numbers (`tabular-nums`) for all timers, metrics, and data displays.
