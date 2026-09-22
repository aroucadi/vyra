/**
 * VYRA Life OS — 3-Layer Design Token Architecture
 * Sourced via ui-ux-pro-max & design-system skill
 */

export const tokens = {
  // Layer 1: Primitives
  primitives: {
    colors: {
      slate: {
        950: "#0B0F17", // Obsidian Void
        900: "#111827", // Surface
        850: "#162032", // Surface Raised
        800: "#1E293B", // Subtle Border
        700: "#334155", // Default Border
        600: "#475569",
        500: "#64748B",
        400: "#94A3B8", // Muted text
        300: "#CBD5E1",
        200: "#E2E8F0",
        100: "#F1F5F9",
        50: "#F8FAFC",  // Primary text dark
      },
      emerald: {
        500: "#10B981", // Train accent
        600: "#059669",
        950: "#022C22",
      },
      cyan: {
        500: "#06B6D4", // Fuel/Eat accent
        600: "#0891B2",
      },
      indigo: {
        500: "#6366F1", // Sleep/Rest accent
      },
      violet: {
        500: "#8B5CF6", // Style accent
      },
      amber: {
        500: "#F59E0B", // Network accent
      },
      rose: {
        500: "#F43F5E", // Danger/alert
      },
    },
    spacing: {
      1: "0.25rem", // 4px
      2: "0.5rem",  // 8px
      3: "0.75rem", // 12px
      4: "1rem",    // 16px
      5: "1.25rem", // 20px
      6: "1.5rem",  // 24px
      8: "2rem",    // 32px
      10: "2.5rem", // 40px
      12: "3rem",   // 48px
    },
    radii: {
      sm: "0.375rem", // 6px
      md: "0.5rem",   // 8px
      lg: "0.75rem",  // 12px
      xl: "1rem",     // 16px
      full: "9999px",
    },
  },

  // Layer 2: Semantics
  semantics: {
    canvas: "var(--canvas)",
    surface: "var(--surface)",
    surfaceRaised: "var(--surface-raised)",
    surfaceBorder: "var(--surface-border)",
    surfaceBorderStrong: "var(--surface-border-strong)",
    text: {
      primary: "var(--text-primary)",
      secondary: "var(--text-secondary)",
      muted: "var(--text-muted)",
      faint: "var(--text-faint)",
    },
    pillars: {
      train: "var(--accent-train)",
      fuel: "var(--accent-fuel)",
      sleep: "var(--accent-sleep)",
      style: "var(--accent-style)",
      network: "var(--accent-network)",
    },
    danger: "var(--danger)",
    focusRing: "var(--focus-ring)",
  },

  // Layer 3: Component Scoped
  components: {
    card: {
      bg: "var(--card-bg)",
      border: "var(--card-border)",
      radius: "var(--card-radius)",
      padding: "var(--card-padding)",
    },
    checkin: {
      touchSize: "2.75rem", // 44px
    },
    log: {
      touchSize: "2.75rem", // 44px
    },
  },
} as const;

export type ThemeTokens = typeof tokens;
