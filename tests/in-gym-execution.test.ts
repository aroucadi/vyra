import { describe, it, expect, vi } from "vitest";
import { soundService } from "@/lib/in-gym/sound";
import { wakeLockService } from "@/lib/in-gym/wakelock";

describe("In-Gym Execution Services (Release 012)", () => {
  describe("Sound Synthesis Service", () => {
    it("handles mute and unmute toggles cleanly", () => {
      soundService.setMuted(true);
      expect(soundService.getIsMuted()).toBe(true);

      soundService.setMuted(false);
      expect(soundService.getIsMuted()).toBe(false);
    });

    it("executes playRestChime without throwing when muted or outside browser", () => {
      soundService.setMuted(true);
      expect(() => soundService.playRestChime()).not.toThrow();

      soundService.setMuted(false);
      expect(() => soundService.playRestChime()).not.toThrow();
    });
  });

  describe("Screen Wake Lock Service", () => {
    it("reports inactive status by default in non-browser test environment", () => {
      expect(wakeLockService.getStatus()).toBe(false);
    });

    it("safely handles release call without throwing", async () => {
      await expect(wakeLockService.release()).resolves.toBeUndefined();
      expect(wakeLockService.getStatus()).toBe(false);
    });
  });
});
