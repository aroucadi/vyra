import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveDeepLinkLift,
  parseDeepLinkParams,
  recordDeepLinkAttribution,
  KNOWN_DEEP_LINK_LIFTS,
} from "../../../src/lib/deep-link";
import { telemetry } from "../../../src/lib/telemetry";

describe("Spec 022: Source-Aware Deep-Link Entry & Reel Attribution", () => {
  describe("Lift Normalization & Resolution", () => {
    it("resolves exact slug for incline dumbbell press", () => {
      const resolved = resolveDeepLinkLift("incline_db_press");
      assert.ok(resolved);
      assert.equal(resolved.displayName, "Incline Dumbbell Press");
      assert.equal(resolved.primaryMuscle, "Clavicular Pectoralis Major");
      assert.equal(resolved.preferredView, "front");
    });

    it("resolves exact slug for cable lateral raise", () => {
      const resolved = resolveDeepLinkLift("cable_lateral_raise");
      assert.ok(resolved);
      assert.equal(resolved.displayName, "Cable Lateral Raise");
      assert.equal(resolved.primaryMuscle, "Lateral Deltoid");
      assert.ok(resolved.setupAnchor.includes("wrist"));
    });

    it("resolves loose alias strings from social video links", () => {
      const rdl = resolveDeepLinkLift("rdl");
      assert.ok(rdl);
      assert.equal(rdl.displayName, "Romanian Deadlift");
      assert.equal(rdl.preferredView, "back");

      const pulldown = resolveDeepLinkLift("lat pulldown");
      assert.ok(pulldown);
      assert.equal(pulldown.displayName, "Lat Pulldown");

      const squat = resolveDeepLinkLift("squat");
      assert.ok(squat);
      assert.equal(squat.displayName, "Barbell Back Squat");
    });

    it("returns null for unknown exercise strings", () => {
      assert.equal(resolveDeepLinkLift("underwater_basket_weaving"), null);
      assert.equal(resolveDeepLinkLift(""), null);
      assert.equal(resolveDeepLinkLift(null), null);
    });
  });

  describe("Query Parameter Parsing", () => {
    it("parses lift, source, campaign, unit, and anchor load from URL search string", () => {
      const query = "?lift=incline_db_press&source=reel_spotlight&campaign=launch_oct&unit=lb&anchor=75";
      const parsed = parseDeepLinkParams(query);

      assert.ok(parsed.liftConfig);
      assert.equal(parsed.liftConfig.slug, "incline_db_press");
      assert.equal(parsed.source, "reel_spotlight");
      assert.equal(parsed.campaign, "launch_oct");
      assert.equal(parsed.unit, "lb");
      assert.equal(parsed.anchorWeight, 75);
    });

    it("parses fallback exercise and utm_source query variants", () => {
      const query = "?exercise=cable_lateral_raise&utm_source=instagram&utm_campaign=lateral_delts";
      const parsed = parseDeepLinkParams(query);

      assert.ok(parsed.liftConfig);
      assert.equal(parsed.liftConfig.slug, "cable_lateral_raise");
      assert.equal(parsed.source, "instagram");
      assert.equal(parsed.campaign, "lateral_delts");
      assert.equal(parsed.unit, "kg"); // default unit
    });
  });

  describe("Telemetry Attribution", () => {
    it("records deep link attribution event cleanly without throwing", () => {
      const parsed = parseDeepLinkParams("?lift=lat_pulldown&source=reddit");
      let called = false;
      const originalTrack = telemetry.track;
      telemetry.track = (event, props) => {
        if (event === "deep_link_arrived") {
          called = true;
          assert.equal(props.source, "reddit");
          assert.equal(props.liftSlug, "lat_pulldown");
        }
      };

      try {
        recordDeepLinkAttribution(parsed, "user_test_attribution");
        assert.equal(called, true);
      } finally {
        telemetry.track = originalTrack;
      }
    });
  });
});
