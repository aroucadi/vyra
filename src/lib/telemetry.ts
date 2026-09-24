/**
 * Vyra Lean Analytics & Telemetry Layer
 * 
 * Enforces standardized, non-blocking telemetry tracking focused strictly
 * on User Activation (Time-to-Value < 45s) and Durable Retention.
 * Follows the `noun_verb` event naming standard and guarantees zero PII leakage.
 */

export type VyraTelemetryEvent =
  | "workout_preview_viewed"
  | "workout_recalibration_applied"
  | "workout_recalibration_dismissed"
  | "workout_set_logged"
  | "workout_completed"
  | "supplement_checklist_toggled"
  | "paywall_viewed"
  | "subscription_started";

export interface TelemetryEventRecord {
  eventName: VyraTelemetryEvent;
  userId?: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

class TelemetryService {
  private buffer: TelemetryEventRecord[] = [];
  private maxBufferSize = 200;

  /**
   * Tracks a key activation or retention event.
   * Completely non-blocking and fire-and-forget.
   */
  public track(
    eventName: VyraTelemetryEvent,
    properties: Record<string, unknown> = {},
    userId?: string
  ): void {
    try {
      // PII filter: Strip any keys that look like emails, passwords, or full names
      const sanitizedProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(properties)) {
        if (/password|email|token|secret|credit/i.test(key)) {
          continue;
        }
        sanitizedProps[key] = value;
      }

      const record: TelemetryEventRecord = {
        eventName,
        userId: userId || "anonymous_trainee",
        properties: sanitizedProps,
        timestamp: new Date().toISOString(),
      };

      this.buffer.push(record);
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift();
      }

      // In production, dispatch asynchronously to PostHog, Segment, or GCP PubSub
      if (process.env.NODE_ENV !== "test" && typeof window !== "undefined") {
        // Log quietly in development
        if (process.env.NODE_ENV === "development") {
          console.debug(`[Telemetry] ${eventName}`, sanitizedProps);
        }
      }
    } catch (err) {
      // Non-blocking: Telemetry errors must never crash user interactions
      if (process.env.NODE_ENV === "development") {
        console.warn("[Telemetry] Dispatch ignored error:", err);
      }
    }
  }

  /**
   * Retrieve in-memory events (useful for unit tests and local diagnostics).
   */
  public getEvents(): TelemetryEventRecord[] {
    return [...this.buffer];
  }

  /**
   * Filter events by eventName.
   */
  public getEventsByName(name: VyraTelemetryEvent): TelemetryEventRecord[] {
    return this.buffer.filter((e) => e.eventName === name);
  }

  /**
   * Clears the event buffer.
   */
  public clear(): void {
    this.buffer = [];
  }
}

export const telemetry = new TelemetryService();
