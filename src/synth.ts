import type { SynthPreset } from './types';

export interface SynthVoice {
  output: AudioNode;
  start(): void;
  stop(): void;
}

const NOISE_SECONDS = 4;
const cache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

/** Deterministic-enough PRNG so tests are stable and buffers are cheap to build. */
function rng(seed: number) {
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

function loopSource(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = buffer;
  s.loop = true;
  return s;
}

function lfo(ctx: BaseAudioContext, hz: number, depth: number, target: AudioParam, offset?: number): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = hz;
  const g = ctx.createGain();
  g.gain.value = depth;
  osc.connect(g).connect(target);
  if (offset !== undefined) target.value = offset;
  return osc;
}

/** Build a synthesised ambience. Call start() after connecting `output`. */
export function createSynth(ctx: BaseAudioContext, preset: SynthPreset): SynthVoice {
  const output = ctx.createGain();
  output.gain.value = 1;
  const starts: Array<() => void> = [];
  const stops: Array<() => void> = [];
  const own = <T extends { start(): void; stop(): void }>(n: T): T => { starts.push(() => n.start()); stops.push(() => { try { n.stop(); } catch { /* already stopped */ } }); return n; };

  switch (preset) {
    case 'white':
    case 'pink':
    case 'brown': {
      const src = own(loopSource(ctx, noiseBuffer(ctx, preset)));
      const trim = ctx.createGain();
      trim.gain.value = preset === 'white' ? 0.25 : preset === 'pink' ? 0.6 : 0.8;
      src.connect(trim).connect(output);
      break;
    }
    case 'rain': {
      // Body: pink noise through a high-pass, swelling slowly. Sheen: white noise through a band-pass.
      const body = own(loopSource(ctx, noiseBuffer(ctx, 'pink')));
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500; hp.Q.value = 0.7;
      const swell = ctx.createGain(); swell.gain.value = 0.55;
      own(lfo(ctx, 0.13, 0.12, swell.gain, 0.55));
      body.connect(hp).connect(swell).connect(output);
      const sheen = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.5;
      const sheenGain = ctx.createGain(); sheenGain.gain.value = 0.16;
      own(lfo(ctx, 0.21, 0.05, sheenGain.gain, 0.16));
      sheen.connect(bp).connect(sheenGain).connect(output);
      break;
    }
    case 'wind': {
      const src = own(loopSource(ctx, noiseBuffer(ctx, 'brown')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 1.2;
      own(lfo(ctx, 0.07, 260, bp.frequency, 420));
      const gust = ctx.createGain(); gust.gain.value = 0.7;
      own(lfo(ctx, 0.11, 0.25, gust.gain, 0.7));
      src.connect(bp).connect(gust).connect(output);
      break;
    }
    case 'fire': {
      // Rumble: brown noise, low-passed. Crackle: white noise gated by random short envelopes.
      const rumble = own(loopSource(ctx, noiseBuffer(ctx, 'brown')));
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      const rumbleGain = ctx.createGain(); rumbleGain.gain.value = 0.7;
      own(lfo(ctx, 0.17, 0.12, rumbleGain.gain, 0.7));
      rumble.connect(lp).connect(rumbleGain).connect(output);
      const crackleSrc = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
      const gate = ctx.createGain(); gate.gain.value = 0;
      crackleSrc.connect(hp).connect(gate).connect(output);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const rand = rng(1234);
      const crackle = () => {
        const t = ctx.currentTime;
        const peak = 0.15 + rand() * 0.35;
        gate.gain.cancelScheduledValues(t);
        gate.gain.setValueAtTime(0, t);
        gate.gain.linearRampToValueAtTime(peak, t + 0.004);
        gate.gain.exponentialRampToValueAtTime(0.001, t + 0.03 + rand() * 0.05);
        timer = setTimeout(crackle, 40 + rand() * 260);
      };
      starts.push(() => { crackle(); });
      stops.push(() => { if (timer) clearTimeout(timer); });
      break;
    }
    case 'hum': {
      const base = 50;
      const partials: Array<[number, number]> = [[1, 0.5], [2, 0.22], [3, 0.1], [4, 0.05]];
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
      for (const [mult, amp] of partials) {
        const osc = own(ctx.createOscillator());
        osc.type = 'sine';
        osc.frequency.value = base * mult;
        const g = ctx.createGain(); g.gain.value = amp;
        osc.connect(g).connect(lp);
      }
      const wobble = ctx.createGain(); wobble.gain.value = 0.6;
      own(lfo(ctx, 0.3, 0.08, wobble.gain, 0.6));
      lp.connect(wobble).connect(output);
      break;
    }
  }

  let started = false;
  return {
    output,
    start() { if (started) return; started = true; starts.forEach((f) => f()); },
    stop() { if (!started) return; started = false; stops.forEach((f) => f()); },
  };
}
