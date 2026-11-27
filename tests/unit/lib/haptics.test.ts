import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { haptics } from "@/lib/haptics";

describe("Sovereign Micro-Haptic Sensory Engine", () => {
  let vibrateCalls: Array<number | number[]> = [];

  beforeEach(() => {
    vibrateCalls = [];
    haptics.setEnabled(true);

    // Mock navigator.vibrate safely on global navigator
    if (typeof globalThis.navigator === "undefined") {
      // @ts-expect-error mocking navigator
      globalThis.navigator = {};
    }
    Object.defineProperty(globalThis.navigator, "vibrate", {
      value: (pattern: number | number[]) => {
        vibrateCalls.push(pattern);
        return true;
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    // @ts-expect-error cleaning mock
    delete globalThis.navigator.vibrate;
  });

  it("triggers 8ms selection tick for tab and chip selections", () => {
    haptics.selection();
    assert.strictEqual(vibrateCalls.length, 1);
    assert.strictEqual(vibrateCalls[0], 8);
  });

  it("triggers 12ms light tap for button presses and steppers", () => {
    haptics.light();
    assert.strictEqual(vibrateCalls.length, 1);
    assert.strictEqual(vibrateCalls[0], 12);
  });

  it("triggers 20ms medium pulse for drawer drag snap and exercise swaps", () => {
    haptics.medium();
    assert.strictEqual(vibrateCalls.length, 1);
    assert.strictEqual(vibrateCalls[0], 20);
  });

  it("triggers 35ms heavy pulse for primary session commencement", () => {
    haptics.heavy();
    assert.strictEqual(vibrateCalls.length, 1);
    assert.strictEqual(vibrateCalls[0], 35);
  });

  it("triggers [12, 35, 18] success rhythmic pattern for set completion", () => {
    haptics.success();
    assert.strictEqual(vibrateCalls.length, 1);
    assert.deepStrictEqual(vibrateCalls[0], [12, 35, 18]);
  });

  it("triggers [25, 40, 25] warning alert pattern for joint pain and fatigue flags", () => {
    haptics.warning();
    assert.strictEqual(vibrateCalls.length, 1);
    assert.deepStrictEqual(vibrateCalls[0], [25, 40, 25]);
  });

  it("respects setEnabled(false) by muting vibration triggers", () => {
    haptics.setEnabled(false);
    haptics.selection();
    haptics.success();
    assert.strictEqual(vibrateCalls.length, 0);
  });

  it("fails gracefully and silently without throwing when navigator.vibrate is undefined", () => {
    // @ts-expect-error Mocking empty navigator
    delete globalThis.navigator.vibrate;
    assert.doesNotThrow(() => {
      haptics.selection();
      haptics.light();
      haptics.success();
    });
  });
});
