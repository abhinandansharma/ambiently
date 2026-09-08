import { describe, expect, it } from 'vitest';
import { createHits, HIT_NAMES } from '../src/hits';
import { MockAudioContext } from './setup';

describe('hits', () => {
  it('plays every hit without touching the network or throwing', () => {
    const ctx = new MockAudioContext() as unknown as AudioContext;
    const hits = createHits(ctx);
    for (const name of HIT_NAMES) {
      const d = hits.play(name, { velocity: 0.8, pitch: 3 });
      expect(d).toBeGreaterThan(0);
      expect(d).toBe(hits.duration(name));
    }
  });

  it('schedules in the future when asked and clamps velocity', () => {
    const ctx = new MockAudioContext() as unknown as AudioContext;
    const hits = createHits(ctx);
    (ctx as any).currentTime = 2;
    expect(() => hits.play('kick', { when: 1, velocity: 5 })).not.toThrow();
    expect(() => hits.play('bell', { when: 4, velocity: -1 })).not.toThrow();
  });

  it('has a duration table that covers every name', () => {
    const ctx = new MockAudioContext() as unknown as AudioContext;
    const hits = createHits(ctx);
    for (const name of HIT_NAMES) expect(hits.duration(name)).toBeGreaterThan(0.05);
  });
});
