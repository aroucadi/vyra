import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseVoiceCommand, voiceCoach } from '@/lib/in-gym/voice-coach';

describe('Voice Coach Natural Speech Parser', () => {
  it('parses explicit log set with reps and weight', () => {
    const cmd = parseVoiceCommand('Log 8 reps at 60 kilos');
    assert.deepEqual(cmd, {
      type: 'LOG_SET',
      reps: 8,
      weightKg: 60,
      rir: undefined,
    });
  });

  it('parses log set with reps, weight, and RIR', () => {
    const cmd = parseVoiceCommand('Logged 10 reps with 55 kg rir 2');
    assert.deepEqual(cmd, {
      type: 'LOG_SET',
      reps: 10,
      weightKg: 55,
      rir: 2,
    });
  });

  it('parses set taken to failure as RIR 0', () => {
    const cmd = parseVoiceCommand('Done 12 reps at 40kg to failure');
    assert.deepEqual(cmd, {
      type: 'LOG_SET',
      reps: 12,
      weightKg: 40,
      rir: 0,
    });
  });

  it('parses weight increment and decrement', () => {
    const up = parseVoiceCommand('plus 2.5');
    assert.deepEqual(up, { type: 'ADJUST_WEIGHT', deltaKg: 2.5 });

    const down = parseVoiceCommand('minus 5');
    assert.deepEqual(down, { type: 'ADJUST_WEIGHT', deltaKg: -5 });
  });

  it('parses station swap / occupied commands', () => {
    assert.equal(parseVoiceCommand('Station is occupied').type, 'SWAP_EXERCISE');
    assert.equal(parseVoiceCommand('Swap exercise').type, 'SWAP_EXERCISE');
    assert.equal(parseVoiceCommand('changer').type, 'SWAP_EXERCISE');
  });

  it('parses skip rest and ready commands', () => {
    assert.equal(parseVoiceCommand('Skip rest').type, 'SKIP_REST');
    assert.equal(parseVoiceCommand('Ready for next set').type, 'SKIP_REST');
  });

  it('parses bonus set requests', () => {
    assert.equal(parseVoiceCommand('Add extra set').type, 'ADD_SET');
  });

  it('handles empty or unrecognized phrases gracefully', () => {
    const res = parseVoiceCommand('hello how are you');
    assert.equal(res.type, 'UNKNOWN');
  });

  it('controls voiceCoach enable and mute state safely in non-browser env', () => {
    voiceCoach.setEnabled(true);
    assert.equal(voiceCoach.getIsEnabled(), true);
    voiceCoach.setMuted(true);
    voiceCoach.speakRestPace(45, 60, 8, 2);
    voiceCoach.setMuted(false);
    voiceCoach.speakSetLogged(8, 60, 2);
  });
});
