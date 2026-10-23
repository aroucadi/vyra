import { test } from "node:test";
import assert from "node:assert/strict";
import { EASE, MS, STAGGER, SPRING_CONFIG } from "../../../src/lib/motion";

test("VYRA Motion Tokens & Physics Engine Specification", async (t) => {
  await t.test("verifies easing curves conform to Knowledge Base requirements", () => {
    // Easing curves must be defined and use valid cubic-bezier formats
    assert.match(EASE.enter, /^cubic-bezier\(/);
    assert.match(EASE.exit, /^cubic-bezier\(/);
    assert.match(EASE.standard, /^cubic-bezier\(/);
    assert.match(EASE.spring, /^cubic-bezier\(/);
  });

  await t.test("verifies perceptual duration timing constraints", () => {
    // Feedback must be snappy (under or equal to 150ms per design principles)
    assert.ok(MS.feedback <= 150, "Feedback must be <= 150ms");
    assert.ok(MS.instant <= 100, "Instant toggle must be <= 100ms");
    assert.ok(MS.move <= 500, "Structural moves must not feel sluggish");
    assert.ok(MS.hero <= 800, "Hero reveal should not exceed 800ms");
  });

  await t.test("verifies cascade stagger thresholds", () => {
    assert.ok(STAGGER.tight < STAGGER.normal);
    assert.ok(STAGGER.normal < STAGGER.relaxed);
    assert.equal(STAGGER.normal, 60, "Normal stagger should be 60ms");
  });

  await t.test("verifies spring damping prevents sickening oscillation", () => {
    // Restrained premium feel requires damping ratio around 0.8
    // damping = 2 * sqrt(m * k) * zeta
    // For touch feedback: m=1, k=400 -> critical damping = 2 * sqrt(400) = 40.
    // Damping of 28 gives zeta = 28 / 40 = 0.70 - 0.85
    const k = SPRING_CONFIG.touchFeedback.stiffness;
    const m = SPRING_CONFIG.touchFeedback.mass;
    const c = SPRING_CONFIG.touchFeedback.damping;
    const criticalDamping = 2 * Math.sqrt(m * k);
    const zeta = c / criticalDamping;

    assert.ok(zeta >= 0.65 && zeta <= 0.95, `Zeta damping ${zeta} should be between 0.65 and 0.95`);
  });
});
