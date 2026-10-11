/**
 * VYRA Motion Tokens & Spring Physics Specification
 * Adheres to Section 4 & 5 of the Design Knowledge Base:
 * - Replace adjectives with exact mathematical specifications
 * - Position and scale may bounce (damping ratio zeta = 0.82)
 * - Opacity never bounces
 * - Durations calibrated to human perception thresholds
 */

export const EASE = {
  // Ease-out expo: Quick snap out, gentle settlement (for entrances)
  enter: "cubic-bezier(0.16, 1, 0.3, 1)",
  // Ease-in expo: Accelerating departure (for exits)
  exit: "cubic-bezier(0.7, 0, 0.84, 0)",
  // Standard natural curve (for layout movements)
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  // Micro-spring feel for press feedback
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const MS = {
  // Instantaneous state switch (checkboxes, toggle switches)
  instant: 100,
  // Micro-feedback (button press, ripple, tactile tap)
  feedback: 150,
  // Element morphing or layout shifts
  morph: 250,
  // Structural movements (sheets, slide drawers, dialog transitions)
  move: 400,
  // Hero reveal or page-level entrance
  hero: 750,
} as const;

export const STAGGER = {
  // Fast list cascade
  tight: 40,
  // Standard card cascade
  normal: 60,
  // Hero section reveal delay
  relaxed: 100,
} as const;

/**
 * Spring physics parameters for UI components using spring solvers
 * - Restrained, premium athletic feel: Damping ratio zeta = 0.82
 * - High stiffness for immediacy, zero sluggishness
 */
export const SPRING_CONFIG = {
  touchFeedback: {
    stiffness: 400,
    damping: 28, // zeta ≈ 0.82
    mass: 1,
  },
  drawerSlide: {
    stiffness: 300,
    damping: 32, // zeta ≈ 0.92
    mass: 1,
  },
  badgePop: {
    stiffness: 500,
    damping: 25, // zeta ≈ 0.70
    mass: 0.8,
  },
} as const;
