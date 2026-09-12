/**
 * NewME Design System Tokens (Stitch Asset: assets/7111496643528512196)
 * Sourced directly from Stitch MCP Design DNA
 */

export const tokens = {
  colors: {
    background: {
      deep: "#0B0F17",
      default: "#0F172A", // Slate 900
      subtle: "#131C2E",
    },
    surface: {
      card: "#162032",
      cardHover: "#1E293B",
      elevated: "#243248",
      overlay: "rgba(15, 23, 42, 0.85)",
    },
    border: {
      subtle: "#1E293B",
      default: "#334155", // Slate 700
      focus: "#10B981",
    },
    accent: {
      primary: "#10B981", // Emerald 500 (Growth, Completed, CTA)
      primaryHover: "#059669",
      secondary: "#06B6D4", // Cyan 500 (Metrics, Timers, Rest)
      secondaryHover: "#0891B2",
      tertiary: "#8B5CF6", // Violet 500 (Trainer actions, Pro features)
      prGold: "#F59E0B", // Amber 500 (PR records, Achievements)
      danger: "#EF4444", // Red (Missed sessions, Alerts)
      warning: "#F97316", // Orange (Plateau warning)
    },
    text: {
      primary: "#F8FAFC", // Slate 50
      secondary: "#94A3B8", // Slate 400
      muted: "#64748B", // Slate 500
      inverse: "#0F172A",
    },
  },
  typography: {
    fontFamily: {
      sans: "var(--font-inter), system-ui, -apple-system, sans-serif",
      mono: "var(--font-mono), monospace",
    },
  },
  radii: {
    sm: "4px",
    md: "8px", // Default 8px per Stitch design system
    lg: "12px",
    full: "9999px",
  },
  animation: {
    micro: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    standard: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export type ThemeTokens = typeof tokens;
