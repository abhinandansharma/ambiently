/** Noise generation shared by the ambiences and the one-shot hits. */

const NOISE_SECONDS = 4;
const cache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

/** Deterministic-enough PRNG so tests are stable and buffers are cheap to build. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Fill a Float32Array with white, pink (Paul Kellet) or brown (leaky integrator) noise in [-1, 1]. */
export function fillNoise(out: Float32Array, kind: 'white' | 'pink' | 'brown', seed = 1): Float32Array {
  const rand = rng(seed);
  if (kind === 'white') {
    for (let i = 0; i < out.length; i++) out[i] = rand() * 2 - 1;
    return out;
  }
  if (kind === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < out.length; i++) {
      const w = rand() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return out;
  }
  let last = 0;
  for (let i = 0; i < out.length; i++) {
    const w = rand() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    out[i] = last * 3.5;
  }
  // brown noise can drift; clamp to be safe
  for (let i = 0; i < out.length; i++) out[i] = Math.max(-1, Math.min(1, out[i]));
  return out;
}

export function noiseBuffer(ctx: BaseAudioContext, kind: 'white' | 'pink' | 'brown'): AudioBuffer {
  let m = cache.get(ctx);
  if (!m) { m = new Map(); cache.set(ctx, m); }
  const hit = m.get(kind);
  if (hit) return hit;
  const buffer = ctx.createBuffer(2, Math.floor(ctx.sampleRate * NOISE_SECONDS), ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) fillNoise(buffer.getChannelData(ch), kind, 7 + ch * 31);
  m.set(kind, buffer);
  return buffer;
}
