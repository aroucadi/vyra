/**
 * @file haptics.ts
 * @description Sovereign Micro-Haptic Sensory Engine for Vyra.
 * Provides crisp, high-precision tactile feedback for mobile devices (Safari / Chrome PWA)
 * with zero dependency overhead. Automatically fails gracefully and silently on unsupported platforms.
 */

export type HapticStyle = "selection" | "light" | "medium" | "heavy" | "success" | "warning";

class HapticEngine {
  private isEnabled: boolean = true;

  private getNavigator(): Navigator | null {
    if (typeof navigator !== "undefined") return navigator;
    if (typeof window !== "undefined" && "navigator" in window) return window.navigator;
    return null;
  }

  private canVibrate(): boolean {
    if (!this.isEnabled) return false;
    const nav = this.getNavigator();
    return !!nav && "vibrate" in nav && typeof nav.vibrate === "function";
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Ultra-subtle 8ms tick for bottom tab changes, segmented controls, and filter chips.
   */
  public selection(): void {
    if (!this.canVibrate()) return;
    try {
      this.getNavigator()?.vibrate(8);
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Crisp 12ms tap for primary button taps, steppers (+ / - reps), and plate adjustments.
   */
  public light(): void {
    if (!this.canVibrate()) return;
    try {
      this.getNavigator()?.vibrate(12);
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Tactile 20ms pulse for drawer snap points, modal open/close, and exercise swaps.
   */
  public medium(): void {
    if (!this.canVibrate()) return;
    try {
      this.getNavigator()?.vibrate(20);
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Solid 35ms pulse for heavy actions, workout start, or timer reset.
   */
  public heavy(): void {
    if (!this.canVibrate()) return;
    try {
      this.getNavigator()?.vibrate(35);
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Rhythmic pattern [12ms, 35ms pause, 18ms] confirming set completion, PR, or workout finish.
   */
  public success(): void {
    if (!this.canVibrate()) return;
    try {
      this.getNavigator()?.vibrate([12, 35, 18]);
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Urgent dual-pulse [25ms, 40ms pause, 25ms] alerting to joint discomfort or CNS fatigue flags.
   */
  public warning(): void {
    if (!this.canVibrate()) return;
    try {
      this.getNavigator()?.vibrate([25, 40, 25]);
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Custom vibration pattern for bespoke kinetic events.
   */
  public trigger(pattern: number | number[]): void {
    if (!this.canVibrate()) return;
    try {
      this.getNavigator()?.vibrate(pattern);
    } catch {
      // Graceful fallback
    }
  }
}

export const haptics = new HapticEngine();
