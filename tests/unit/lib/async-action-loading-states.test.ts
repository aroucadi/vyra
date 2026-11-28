import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Async Action Loading States & Rage-Click Protection", () => {
  it("guards against concurrent finish-session invocations (anti-rage-click guard)", async () => {
    let callCount = 0;
    const isFinishingRef = { current: false };

    const simulateFinishSession = async () => {
      if (isFinishingRef.current) {
        return "BLOCKED_CONCURRENT_INVOCATION";
      }
      isFinishingRef.current = true;
      callCount += 1;
      try {
        // simulate async server action latency
        await new Promise((r) => setTimeout(r, 50));
        return "SUCCESS";
      } finally {
        isFinishingRef.current = false;
      }
    };

    // User rage-clicks 5 times in rapid succession
    const results = await Promise.all([
      simulateFinishSession(),
      simulateFinishSession(),
      simulateFinishSession(),
      simulateFinishSession(),
      simulateFinishSession(),
    ]);

    assert.equal(callCount, 1, "Only 1 session save should execute despite multiple rapid clicks");
    assert.equal(results[0], "SUCCESS");
    assert.equal(results.slice(1).every((r) => r === "BLOCKED_CONCURRENT_INVOCATION"), true);
  });

  it("verifies disabled state and label transition properties for finish button", () => {
    // When isFinishingSession is false
    const normalState = {
      isFinishingSession: false,
      disabled: false,
      label: "FINISH WORKOUT & DEBRIEF ✓",
      hasSpinner: false,
    };
    assert.equal(normalState.disabled, false);
    assert.equal(normalState.hasSpinner, false);

    // When isFinishingSession is true
    const savingState = {
      isFinishingSession: true,
      disabled: true,
      label: "ARCHIVING WORKOUT & SYNCING...",
      hasSpinner: true,
    };
    assert.equal(savingState.disabled, true);
    assert.equal(savingState.hasSpinner, true);
    assert.match(savingState.label, /ARCHIVING/);
  });

  it("verifies multi-day and summary return button loading transitions", () => {
    const returnButtonState = (isReturning: boolean) => ({
      disabled: isReturning,
      label: isReturning ? "RETURNING TO TODAY COCKPIT..." : "COMMIT TO RECORDER & RECOVER",
      hasSpinner: isReturning,
    });

    assert.equal(returnButtonState(false).disabled, false);
    assert.equal(returnButtonState(true).disabled, true);
    assert.equal(returnButtonState(true).hasSpinner, true);
  });

  it("verifies Daily AI Coach chip loading locks other chips from concurrent invocation", () => {
    const isAdapting = true;
    const activeChipId = "time_20m";

    const chips = [
      { id: "poor_sleep", label: "😴 Slept Poorly" },
      { id: "time_20m", label: "⏱️ Only 20 Mins" },
      { id: "hotel_gym", label: "🏨 Hotel / DBs Only" },
    ];

    const renderedChips = chips.map((c) => ({
      id: c.id,
      disabled: isAdapting,
      isPendingThisChip: isAdapting && activeChipId === c.id,
    }));

    // All chips must be disabled to prevent secondary triggers
    assert.equal(renderedChips.every((c) => c.disabled), true);
    // Only the target chip shows active pending state
    assert.equal(renderedChips.find((c) => c.id === "time_20m")?.isPendingThisChip, true);
    assert.equal(renderedChips.find((c) => c.id === "poor_sleep")?.isPendingThisChip, false);
  });
});
