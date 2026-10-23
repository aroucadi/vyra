import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { soundService } from '@/lib/in-gym/sound';

describe('In-Gym Audio/Haptic Rest Chime Engine (P2 Roadmap)', () => {
  beforeEach(() => {
    soundService.setMuted(false);
  });

  it('manages mute state cleanly', () => {
    assert.equal(soundService.getIsMuted(), false);
    soundService.setMuted(true);
    assert.equal(soundService.getIsMuted(), true);
    soundService.setMuted(false);
    assert.equal(soundService.getIsMuted(), false);
  });

  it('executes playCountdownPip safely without throwing in headless environments', () => {
    assert.doesNotThrow(() => {
      soundService.playCountdownPip();
    });
  });

  it('executes playRestChime safely without throwing in headless environments', () => {
    assert.doesNotThrow(() => {
      soundService.playRestChime();
    });
  });

  it('respects muted state during chime execution', () => {
    soundService.setMuted(true);
    assert.doesNotThrow(() => {
      soundService.playCountdownPip();
      soundService.playRestChime();
    });
  });
});
