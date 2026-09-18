import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VYRA_PILLARS } from "../../../src/components/trainee/VyraLifeHub.tsx";

describe("Vyra Super App & Life Hub Architecture", () => {
  it("defines the 5 core personal life optimization pillars", () => {
    assert.equal(VYRA_PILLARS.length, 5);

    const pillarIds = VYRA_PILLARS.map((p) => p.id);
    assert.ok(pillarIds.includes("fitness"), "Must contain fitness pillar");
    assert.ok(pillarIds.includes("nutrition"), "Must contain nutrition pillar");
    assert.ok(pillarIds.includes("health"), "Must contain health pillar");
    assert.ok(pillarIds.includes("style"), "Must contain style pillar");
    assert.ok(pillarIds.includes("social"), "Must contain local experiences/social pillar");
  });

  it("verifies active status and rich deliverables for core fitness and nutrition pillars", () => {
    const fitness = VYRA_PILLARS.find((p) => p.id === "fitness");
    assert.ok(fitness);
    assert.equal(fitness.status, "active");
    assert.ok(fitness.highlights.some((h) => h.includes("Exercise Confidence Card")));
    assert.ok(fitness.highlights.some((h) => h.includes("MuscleWiki")));

    const nutrition = VYRA_PILLARS.find((p) => p.id === "nutrition");
    assert.ok(nutrition);
    assert.equal(nutrition.status, "active");
    assert.ok(nutrition.highlights.some((h) => h.includes("Creatine")));
    assert.ok(nutrition.highlights.some((h) => h.includes("Hydration")));
  });

  it("verifies life optimization pillars have valid action links and metrics", () => {
    for (const pillar of VYRA_PILLARS) {
      assert.ok(pillar.title.length > 0);
      assert.ok(pillar.headlineMetric.length > 0);
      assert.ok(pillar.highlights.length >= 3);
      assert.ok(pillar.ctaLabel.length > 0);
      assert.ok(pillar.ctaHref.length > 0);
    }
  });
});
