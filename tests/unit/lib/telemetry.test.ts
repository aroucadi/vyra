import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { telemetry } from "../../../src/lib/telemetry";

describe("Vyra Lean Analytics & Telemetry Layer", () => {
  beforeEach(() => {
    telemetry.clear();
  });

  it("records activation and retention events cleanly", () => {
    telemetry.track("workout_preview_viewed", {
      program_id: "prog_123",
      time_to_view_ms: 320,
    }, "trainee_alaa");

    telemetry.track("workout_recalibration_applied", {
      sleep_hours: 5.5,
      load_delta_kg: -20,
    }, "trainee_alaa");

    const events = telemetry.getEvents();
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[0].eventName, "workout_preview_viewed");
    assert.strictEqual(events[0].userId, "trainee_alaa");
    assert.strictEqual(events[1].eventName, "workout_recalibration_applied");
  });

  it("strictly scrubs PII and personal health fields from event payloads", () => {
    telemetry.track("workout_set_logged", {
      set_index: 1,
      target_reps: 10,
      user_email: "secret@example.com",
      auth_token: "super-secret-jwt",
      bodyweight_kg: 80,
      bmi_value: 22,
    });

    const events = telemetry.getEvents();
    assert.strictEqual(events.length, 1);
    const props = events[0].properties;
    assert.strictEqual(props.set_index, 1);
    assert.strictEqual(props.target_reps, 10);
    assert.strictEqual(props.user_email, undefined);
    assert.strictEqual(props.auth_token, undefined);
    assert.strictEqual(props.bodyweight_kg, undefined);
    assert.strictEqual(props.bmi_value, undefined);
  });

  it("filters events by specific event name", () => {
    telemetry.track("workout_preview_viewed", { screen: "today" });
    telemetry.track("workout_set_logged", { reps: 8 });
    telemetry.track("workout_completed", { duration_sec: 2400 });

    const setLogs = telemetry.getEventsByName("workout_set_logged");
    assert.strictEqual(setLogs.length, 1);
    assert.strictEqual(setLogs[0].properties.reps, 8);
  });
});
