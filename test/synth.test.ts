import { describe, it, expect } from 'vitest';
import { fillNoise, createSynth } from '../src/synth';
import { MockAudioContext } from './setup';

describe('noise', () => {
  for (const kind of ['white', 'pink', 'brown'] as const) {
    it(`${kind} noise stays within [-1, 1] and is not silent`, () => {
      const out = fillNoise(new Float32Array(20000), kind);
      let min = 1, max = -1, energy = 0;
      for (const v of out) { min = Math.min(min, v); max = Math.max(max, v); energy += v * v; }
      expect(min).toBeGreaterThanOrEqual(-1);
      expect(max).toBeLessThanOrEqual(1);
      expect(energy / out.length).toBeGreaterThan(0.001);
    });
  }
  it('is deterministic for a given seed', () => {
    const a = fillNoise(new Float32Array(64), 'pink', 5);
    const b = fillNoise(new Float32Array(64), 'pink', 5);
    expect(Array.from(a)).toEqual(Array.from(b));
  });
});

describe('createSynth', () => {
  for (const preset of ['white', 'pink', 'brown', 'rain', 'wind', 'fire', 'hum'] as const) {
    it(`builds and starts "${preset}" without touching the network`, () => {
      const ctx = new MockAudioContext() as unknown as AudioContext;
      const voice = createSynth(ctx, preset);
      expect(voice.output).toBeTruthy();
      voice.start();
      voice.stop();
    });
  }
});
