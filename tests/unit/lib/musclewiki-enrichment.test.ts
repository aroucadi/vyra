import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { alaaProgramMuscleWikiExercises } from "../../../src/db/seed/musclewiki-enriched-exercises.ts";
import { seedExercises } from "../../../src/db/seed/exercises.ts";
import { runEnrichment } from "../../../scripts/enrich-musclewiki-exercises.ts";

describe("MuscleWiki Exercise Library Integration & Quota-Guarded Seeding", () => {
  it("verifies all pre-cached Alaa program exercises adhere to MuscleWiki schema", () => {
    assert.ok(alaaProgramMuscleWikiExercises.length >= 17, "Must have at least 17 master blueprint movements");

    alaaProgramMuscleWikiExercises.forEach((ex) => {
      // 1. MuscleWiki Identifiers & Taxonomy
      assert.ok(ex.id, "Exercise must have an ID");
      assert.ok(ex.name, "Exercise must have a name");
      assert.ok(typeof ex.muscleWikiId === "number", `Exercise ${ex.name} must have a numeric MuscleWiki ID`);
      assert.ok(
        ["Beginner", "Intermediate", "Advanced"].includes(ex.difficulty || ""),
        `Exercise ${ex.name} must have a valid difficulty rating`
      );

      // 2. Muscles & Equipment
      assert.ok(ex.primaryMuscle, `Exercise ${ex.name} must have a primary muscle`);
      assert.ok(Array.isArray(ex.secondaryMuscles), `Exercise ${ex.name} must have secondary muscles array`);
      assert.ok(ex.equipment, `Exercise ${ex.name} must have equipment type`);

      // 3. MuscleWiki Steps & Media
      assert.ok(Array.isArray(ex.steps), `Exercise ${ex.name} must have steps array`);
      assert.ok((ex.steps?.length || 0) >= 3, `Exercise ${ex.name} must have at least 3 instructional steps`);
      assert.ok(Array.isArray(ex.mediaUrls), `Exercise ${ex.name} must have media URLs`);
      assert.ok((ex.mediaUrls?.length || 0) >= 1, `Exercise ${ex.name} must have at least 1 media URL`);
      assert.ok(ex.muscleWikiUrl?.startsWith("https://musclewiki.com/"), `Exercise ${ex.name} must have a valid MuscleWiki web URL`);
    });
  });

  it("verifies seedExercises integrates MuscleWiki metadata without breaking base library", () => {
    const enrichedInSeed = seedExercises.filter((e) => e.muscleWikiId !== undefined);
    assert.ok(enrichedInSeed.length >= 20, "At least 20 exercises in seedExercises must be MuscleWiki enriched");

    // Spot-check key movements from Alaa's protocol
    const chestPress = seedExercises.find((e) => e.name === "Incline Machine Chest Press");
    assert.ok(chestPress);
    assert.equal(chestPress.muscleWikiId, 1042);
    assert.equal(chestPress.difficulty, "Beginner");
    assert.ok(chestPress.steps && chestPress.steps.length >= 4);

    const latPulldown = seedExercises.find((e) => e.name === "Neutral-Grip Lat Pulldown");
    assert.ok(latPulldown);
    assert.equal(latPulldown.muscleWikiId, 1010);
    assert.ok(latPulldown.mediaUrls && latPulldown.mediaUrls.length > 0);

    const rdl = seedExercises.find((e) => e.name === "Barbell Romanian Deadlift");
    assert.ok(rdl);
    assert.equal(rdl.muscleWikiId, 4020);
    assert.equal(rdl.difficulty, "Intermediate");
  });

  it("executes enrichment migration engine in offline mode without burning API quota", async () => {
    const result = await runEnrichment({
      offline: true,
      dryRun: true,
      limit: 10,
    });

    assert.ok(result.totalEvaluated > 0);
    assert.equal(result.apiCallsMade, 0, "Offline run must make strictly 0 API calls to protect quota");
    assert.ok(result.totalEnriched >= 20, "Should reflect all cached exercises");
  });
});
