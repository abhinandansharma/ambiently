import { describe, it, expect } from 'vitest';
import { createSynth } from '../src/synth';
import { fillNoise } from '../src/noise';
import { SYNTH_PRESETS } from '../src/types';
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
  for (const preset of SYNTH_PRESETS) {
    it(`builds, starts and stops "${preset}" without touching the network`, async () => {
      const ctx = new MockAudioContext() as unknown as AudioContext;
      const voice = createSynth(ctx, preset);
      expect(voice.output).toBeTruthy();
      voice.start();
      await new Promise((r) => setTimeout(r, 30));
      voice.stop();
      const before = (ctx as unknown as MockAudioContext).created.sources.length;
      await new Promise((r) => setTimeout(r, 60));
      expect((ctx as unknown as MockAudioContext).created.sources.length).toBe(before);
    });
  }
  it('lists twenty-five presets with no duplicates', () => {
    expect(new Set(SYNTH_PRESETS).size).toBe(25);
  });
});
