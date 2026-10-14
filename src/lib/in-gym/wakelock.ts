/**
 * @file wakelock.ts
 * @description Screen Wake Lock API manager adapted from openGym wakelock.js.
 * Keeps phone screen awake during active gym workouts so timers and weights stay visible.
 */

class ScreenWakeLockService {
  private sentinel: any = null;
  private isActive: boolean = false;

  public async acquire(): Promise<boolean> {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      return false;
    }

    try {
      this.sentinel = await (navigator as any).wakeLock.request("screen");
      this.isActive = true;

      this.sentinel.addEventListener("release", () => {
        this.isActive = false;
        this.sentinel = null;
      });

      return true;
    } catch {
      this.isActive = false;
      return false;
    }
  }

  public async release(): Promise<void> {
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // Safe ignore
      } finally {
        this.sentinel = null;
        this.isActive = false;
      }
    }
  }

  public getStatus(): boolean {
    return this.isActive;
  }
}

export const wakeLockService = new ScreenWakeLockService();
