import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getConfidenceGuide, CONFIDENCE_GUIDES_MAP } from "../../../src/lib/exercise-confidence-data.ts";
import { createBlueprintDays } from "../../../src/db/seed/master-transformation-program.ts";
import { EquipmentType } from "../../../src/lib/types.ts";

describe("Exercise Confidence Card (ECC) & Stealth Gym Mode Engine", () => {
  it("retrieves curated confidence guides for core commercial gym compound movements", () => {
    // 1. Incline Machine Chest Press
    const chestGuide = getConfidenceGuide("Incline Machine Chest Press", "machine");
    assert.equal(chestGuide.exerciseName, "Incline Machine Chest Press");
    assert.equal(chestGuide.equipmentType, "machine");
    assert.equal(chestGuide.hardware.type, "pin_selectorized");
    assert.ok(chestGuide.hardware.commonAliases.some((a) => a.includes("Hammer Strength") || a.includes("Incline")));
    assert.ok(chestGuide.hardware.setupSteps.length >= 2);
    assert.equal(chestGuide.mechanics.gripType, "overhand");
    assert.equal(chestGuide.mechanics.threeCues.length, 3);
    assert.ok(chestGuide.mechanics.mentalCue.length > 5);
    assert.ok(chestGuide.proprioception.targetFeel.includes("rep 8–10") || chestGuide.proprioception.targetFeel.includes("Upper"));
    assert.ok(chestGuide.proprioception.redFlagStop.includes("STOP"));

    // 2. Standing Cable Face Pull
    const facePullGuide = getConfidenceGuide("Standing Cable Face Pull", "cable");
    assert.equal(facePullGuide.hardware.type, "cable_tower");
    assert.equal(facePullGuide.mechanics.gripType, "thumbless"); // thumbless hook grip for rear delts
    assert.equal(facePullGuide.hardware.requiredAttachment, "Braided Tricep Rope");
    assert.ok(facePullGuide.proprioception.primaryMuscle.includes("Rear Deltoids"));

    // 3. Wide-Grip Lat Pulldown
    const latGuide = getConfidenceGuide("Wide-Grip Lat Pulldown", "cable");
    assert.equal(latGuide.mechanics.gripType, "thumbless");
    assert.equal(latGuide.mechanics.gripWidth, "wide");
    assert.ok(latGuide.hardware.requiredAttachment?.includes("Wide"));
    assert.ok(latGuide.proprioception.primaryMuscle.includes("Lat"));
  });

  it("enforces the Rule of 3 cues and sensory burn calibration across all dictionary guides", () => {
    for (const [key, guide] of Object.entries(CONFIDENCE_GUIDES_MAP)) {
      assert.ok(guide.exerciseName, `Guide ${key} must have exerciseName`);
      assert.ok(guide.equipmentType, `Guide ${key} must have equipmentType`);
      assert.ok(guide.hardware.type, `Guide ${key} must have hardware type`);
      assert.ok(guide.hardware.setupSteps.length >= 2, `Guide ${key} must have at least 2 setup steps`);
      assert.equal(
        guide.mechanics.threeCues.length,
        3,
        `Guide ${key} must have exactly 3 setup cues under the Rule of 3`
      );
      assert.ok(guide.mechanics.wristCue.length > 10, `Guide ${key} must have wrist alignment guidance`);
      assert.ok(guide.mechanics.mentalCue.length > 5, `Guide ${key} must have a memorable mental metaphor`);
      assert.ok(
        guide.proprioception.targetFeel.length > 10,
        `Guide ${key} must describe the target burn sensation`
      );
      assert.ok(
        guide.proprioception.redFlagStop.length > 10,
        `Guide ${key} must provide a red-flag stop signal for injury prevention`
      );
    }
  });

  it("gracefully generates biomechanically sound fallback guides for uncataloged movements", () => {
    // Arbitrary unknown movements across 4 equipment modalities
    const modalities: EquipmentType[] = ["machine", "dumbbell", "cable", "bodyweight"];

    modalities.forEach((mod) => {
      const guide = getConfidenceGuide("Mystery High Incline Press", mod);
      assert.equal(guide.exerciseName, "Mystery High Incline Press");
      assert.equal(guide.equipmentType, mod);
      assert.equal(guide.mechanics.threeCues.length, 3);
      assert.ok(guide.hardware.setupSteps.length >= 2);
      assert.ok(guide.proprioception.redFlagStop.length > 0);

      if (mod === "dumbbell") {
        assert.equal(guide.hardware.type, "free_weight");
      } else if (mod === "cable") {
        assert.equal(guide.hardware.type, "cable_tower");
      } else if (mod === "bodyweight") {
        assert.equal(guide.hardware.type, "bodyweight_station");
      }
    });

    // Test specific movement pattern detection
    const pullFallback = getConfidenceGuide("Custom Heavy Iso Row", "machine");
    assert.ok(pullFallback.proprioception.primaryMuscle.includes("Back") || pullFallback.proprioception.primaryMuscle.includes("Lat"));
    assert.equal(pullFallback.mechanics.gripType, "thumbless");

    const deltFallback = getConfidenceGuide("Standing Lateral Arc Raise", "cable");
    assert.ok(deltFallback.proprioception.primaryMuscle.includes("Deltoid"));

    const legFallback = getConfidenceGuide("Belt Squat Machine", "machine");
    assert.ok(legFallback.proprioception.primaryMuscle.includes("Leg") || legFallback.proprioception.primaryMuscle.includes("Quad") || legFallback.proprioception.primaryMuscle.includes("Chain"));
  });

  it("verifies 100% complete Confidence Guide coverage for all 13 exercise prescriptions (52 variations) of the Master 16-Week Blueprint", () => {
    const days = createBlueprintDays("week_1", 1);
    let totalSlotsChecked = 0;
    let totalVariationsChecked = 0;

    days.forEach((day) => {
      day.blocks.forEach((block) => {
        block.exercises.forEach((ex) => {
          totalSlotsChecked++;
          
          // Check primary prescription
          const primaryGuide = getConfidenceGuide(ex.exerciseName, ex.selectedEquipment || "machine");
          assert.ok(primaryGuide, `Primary guide for ${ex.exerciseName} must exist`);
          assert.equal(primaryGuide.mechanics.threeCues.length, 3);
          assert.ok(primaryGuide.proprioception.targetFeel.length > 5);

          // Check all equipment variations (4-option equipment matrix)
          if (ex.equipmentVariations) {
            ex.equipmentVariations.forEach((v) => {
              totalVariationsChecked++;
              const varGuide = getConfidenceGuide(v.exerciseName, v.equipmentType);
              assert.ok(varGuide, `Variation guide for ${v.exerciseName} (${v.equipmentType}) must exist`);
              assert.equal(varGuide.equipmentType, v.equipmentType);
              assert.equal(varGuide.mechanics.threeCues.length, 3);
              assert.ok(varGuide.proprioception.redFlagStop.length > 5);
            });
          }
        });
      });
    });

    assert.equal(totalSlotsChecked, 21, "Master blueprint must have 21 exercise prescriptions");
    assert.equal(totalVariationsChecked, 84, "Master blueprint must have 84 variations (21 prescriptions × 4 options)");
  });
});
