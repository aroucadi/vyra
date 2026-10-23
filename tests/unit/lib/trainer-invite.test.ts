import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  encodeTrainerInvite,
  decodeTrainerInvite,
  generateCoachInviteUrl,
  acceptCoachInvite,
  TrainerInvitePayload,
} from "../../../src/lib/trainer-invite";
import { appStore } from "../../../src/lib/store";

describe("Spec 023: B2B2C Trainer-Invite & Onboarding Flow", () => {
  const samplePayload: TrainerInvitePayload = {
    coachId: "coach_julian_1",
    coachName: "Coach Julian",
    programTitle: "16-Week Recomposition & Structural Balance",
    weeks: 16,
    anchorLift: "barbell_bench",
    startingBenchKg: 85,
    unit: "kg",
    customNote: "Your custom mesocycle is loaded and ready for Day 1.",
    traineeName: "Marcus Vance",
  };

  describe("Token Encoding & Decoding", () => {
    it("encodes and decodes invite payload losslessly", () => {
      const token = encodeTrainerInvite(samplePayload);
      assert.ok(typeof token === "string");
      assert.ok(token.length > 20);

      const decoded = decodeTrainerInvite(token);
      assert.ok(decoded);
      assert.equal(decoded.coachId, samplePayload.coachId);
      assert.equal(decoded.coachName, samplePayload.coachName);
      assert.equal(decoded.programTitle, samplePayload.programTitle);
      assert.equal(decoded.weeks, 16);
      assert.equal(decoded.startingBenchKg, 85);
      assert.equal(decoded.customNote, samplePayload.customNote);
      assert.equal(decoded.traineeName, samplePayload.traineeName);
    });

    it("returns null for malformed or corrupted tokens without throwing", () => {
      assert.equal(decodeTrainerInvite("not_a_valid_token"), null);
      assert.equal(decodeTrainerInvite(""), null);
    });

    it("generates full canonical invite URL", () => {
      const url = generateCoachInviteUrl("https://app.vyra.fit", samplePayload);
      assert.ok(url.startsWith("https://app.vyra.fit/invite/coach_julian_1?token="));
    });
  });

  describe("Invite Acceptance & Roster Binding", () => {
    it("binds new trainee to coach, sets up 16-week mesocycle, and updates roster", () => {
      const testTraineeId = `trainee_invite_test_${Date.now()}`;
      const res = acceptCoachInvite(testTraineeId, samplePayload);

      assert.equal(res.success, true);
      assert.ok(res.programId);
      assert.equal(res.trainee.id, testTraineeId);
      assert.equal(res.trainee.name, "Marcus Vance");

      // Verify trainee active program has trainerId assigned
      const activeProg = appStore.getActiveProgramForTrainee(testTraineeId);
      assert.ok(activeProg);
      assert.equal(activeProg.trainerId, "coach_julian_1");
      assert.equal(activeProg.title, "16-Week Recomposition & Structural Balance");

      // Verify trainee is now present in the roster
      const roster = appStore.getRoster();
      const inRoster = roster.find((item) => item.trainee.id === testTraineeId);
      assert.ok(inRoster);
      assert.equal(inRoster.trainee.name, "Marcus Vance");

      // Verify current user was switched to the trainee for zero-gate workout entry
      assert.equal(appStore.getCurrentUser().id, testTraineeId);
    });
  });
});
