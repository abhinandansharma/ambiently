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

/**
 * A self-rescheduling timer for presets with events (crackles, chirps, rolls). `tick` returns the delay to the next
 * call in ms. Stopping clears the pending timeout, so a stopped voice never touches the graph again.
 */
function repeat(tick: () => number, firstDelayMs: number): { start(): void; stop(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  const run = () => { if (!running) return; const next = tick(); timer = setTimeout(run, Math.max(10, next)); };
  return {
    start() { if (running) return; running = true; timer = setTimeout(run, Math.max(0, firstDelayMs)); },
    stop() { running = false; if (timer) { clearTimeout(timer); timer = undefined; } },
  };
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
    case 'ocean': {
      // Swell: brown noise, low-passed, breathing slowly. Foam: white noise band-passed, cresting a little later.
      const swell = own(loopSource(ctx, noiseBuffer(ctx, 'brown')));
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.8;
      own(lfo(ctx, 0.07, 350, lp.frequency, 700));
      const swellGain = ctx.createGain();
      own(lfo(ctx, 0.07, 0.3, swellGain.gain, 0.45));
      swell.connect(lp).connect(swellGain).connect(output);
      const foam = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.6;
      const foamGain = ctx.createGain();
      own(lfo(ctx, 0.083, 0.07, foamGain.gain, 0.08));
      foam.connect(bp).connect(foamGain).connect(output);
      break;
    }
    case 'stream': {
      // Babble: pink noise through a band-pass that flutters. Sparkle: white noise higher up. Body: a little brown.
      const babble = own(loopSource(ctx, noiseBuffer(ctx, 'pink')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.7;
      own(lfo(ctx, 1.3, 260, bp.frequency, 1500));
      const babbleGain = ctx.createGain();
      own(lfo(ctx, 0.9, 0.08, babbleGain.gain, 0.5));
      babble.connect(bp).connect(babbleGain).connect(output);
      const sparkle = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 5200; hp.Q.value = 1;
      own(lfo(ctx, 2.1, 900, hp.frequency, 5200));
      const sparkleGain = ctx.createGain(); sparkleGain.gain.value = 0.09;
      sparkle.connect(hp).connect(sparkleGain).connect(output);
      const body = own(loopSource(ctx, noiseBuffer(ctx, 'brown')));
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
      const bodyGain = ctx.createGain(); bodyGain.gain.value = 0.25;
      body.connect(lp).connect(bodyGain).connect(output);
      break;
    }
    case 'thunder': {
      // A constant far-off rumble plus rolls every so often: a slow rise, a long decay, and the filter opening with it.
      const src = own(loopSource(ctx, noiseBuffer(ctx, 'brown')));
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 1.1;
      const floor = ctx.createGain(); floor.gain.value = 0.12;
      src.connect(lp).connect(floor).connect(output);
      const roll = ctx.createGain(); roll.gain.value = 0;
      const rollLp = ctx.createBiquadFilter(); rollLp.type = 'lowpass'; rollLp.frequency.value = 220;
      src.connect(rollLp).connect(roll).connect(output);
      const rand = rng(99);
      const timer = repeat(() => {
        const t = ctx.currentTime;
        const rise = 0.3 + rand() * 0.9, hold = 0.2 + rand() * 0.6, decay = 2 + rand() * 4, peak = 0.5 + rand() * 0.5;
        roll.gain.cancelScheduledValues(t); roll.gain.setValueAtTime(0.0001, t);
        roll.gain.linearRampToValueAtTime(peak, t + rise);
        roll.gain.linearRampToValueAtTime(peak * 0.7, t + rise + hold);
        roll.gain.exponentialRampToValueAtTime(0.0001, t + rise + hold + decay);
        rollLp.frequency.cancelScheduledValues(t); rollLp.frequency.setValueAtTime(220, t);
        rollLp.frequency.linearRampToValueAtTime(90 + rand() * 60, t + rise + hold + decay);
        return 5000 + rand() * 14000;
      }, 1500 + rand() * 2500);
      starts.push(timer.start); stops.push(timer.stop);
      break;
    }
    case 'crickets': {
      // Two crickets: a high sine pulsed at about 40 Hz, chirping in short bursts at their own tempo.
      const rand = rng(21);
      for (const [hz, pulse, period] of [[4300, 38, 460], [3900, 33, 610]] as Array<[number, number, number]>) {
        const osc = own(ctx.createOscillator()); osc.type = 'sine'; osc.frequency.value = hz;
        const am = ctx.createGain();
        own(lfo(ctx, pulse, 0.5, am.gain, 0.5));
        const gate = ctx.createGain(); gate.gain.value = 0;
        const level = ctx.createGain(); level.gain.value = 0.045;
        osc.connect(am).connect(gate).connect(level).connect(output);
        const timer = repeat(() => {
          const t = ctx.currentTime;
          const len = 0.09 + rand() * 0.08;
          gate.gain.cancelScheduledValues(t); gate.gain.setValueAtTime(0, t);
          gate.gain.linearRampToValueAtTime(1, t + 0.012);
          gate.gain.setValueAtTime(1, t + len);
          gate.gain.linearRampToValueAtTime(0, t + len + 0.02);
          return period + (rand() - 0.5) * 120 + (rand() < 0.08 ? 1500 + rand() * 2000 : 0);
        }, rand() * 400);
        starts.push(timer.start); stops.push(timer.stop);
      }
      break;
    }
    case 'birds': {
      // Songbirds: short sine sweeps in little phrases of one to four notes, from birds near and far.
      const rand = rng(7);
      const level = ctx.createGain(); level.gain.value = 0.16;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500;
      level.connect(hp).connect(output);
      const note = (t: number, f0: number, f1: number, dur: number, amp: number) => {
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f1, t + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(amp, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(level);
        o.start(t); o.stop(t + dur + 0.02);
      };
      const timer = repeat(() => {
        let t = ctx.currentTime + 0.05;
        const far = rand() < 0.5, amp = far ? 0.25 : 0.7, base = 1800 + rand() * 2600, count = 1 + Math.floor(rand() * 4);
        for (let i = 0; i < count; i++) {
          const dur = 0.06 + rand() * 0.14;
          note(t, base * (0.9 + rand() * 0.2), base * (0.7 + rand() * 0.8), dur, amp);
          t += dur + 0.03 + rand() * 0.08;
        }
        return 700 + rand() * 2800;
      }, 300);
      starts.push(timer.start); stops.push(timer.stop);
      break;
    }
    case 'frogs': {
      // A pond at dusk: low croaks, each a few quick pulses of a soft square wave, from a couple of frogs.
      const rand = rng(48);
      const level = ctx.createGain(); level.gain.value = 0.18;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      level.connect(lp).connect(output);
      const croak = (t: number, hz: number, amp: number) => {
        const pulses = 3 + Math.floor(rand() * 4);
        for (let i = 0; i < pulses; i++) {
          const o = ctx.createOscillator(); o.type = 'square';
          o.frequency.setValueAtTime(hz, t); o.frequency.exponentialRampToValueAtTime(hz * 0.8, t + 0.05);
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(amp, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
          o.connect(g).connect(level); o.start(t); o.stop(t + 0.06);
          t += 0.06;
        }
      };
      const timer = repeat(() => {
        croak(ctx.currentTime + 0.05, 150 + rand() * 120, rand() < 0.4 ? 0.3 : 0.7);
        return 900 + rand() * 2600;
      }, 400);
      starts.push(timer.start); stops.push(timer.stop);
      break;
    }
    case 'snow': {
      // A blizzard: wind with more top end than the plain preset, gusting harder and whistling through gaps.
      const src = own(loopSource(ctx, noiseBuffer(ctx, 'pink')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.9;
      own(lfo(ctx, 0.05, 500, bp.frequency, 900));
      const gust = ctx.createGain();
      own(lfo(ctx, 0.09, 0.3, gust.gain, 0.5));
      src.connect(bp).connect(gust).connect(output);
      const whistle = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const wb = ctx.createBiquadFilter(); wb.type = 'bandpass'; wb.frequency.value = 2400; wb.Q.value = 12;
      own(lfo(ctx, 0.13, 700, wb.frequency, 2400));
      const whistleGain = ctx.createGain();
      own(lfo(ctx, 0.17, 0.05, whistleGain.gain, 0.05));
      whistle.connect(wb).connect(whistleGain).connect(output);
      break;
    }
    case 'city': {
      // Traffic bed: low brown rumble. Cars passing: a band of noise that swells, sweeps up in pitch and fades.
      const bed = own(loopSource(ctx, noiseBuffer(ctx, 'brown')));
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
      const bedGain = ctx.createGain();
      own(lfo(ctx, 0.09, 0.12, bedGain.gain, 0.45));
      bed.connect(lp).connect(bedGain).connect(output);
      const pass = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.1;
      const passGain = ctx.createGain(); passGain.gain.value = 0;
      pass.connect(bp).connect(passGain).connect(output);
      const rand = rng(3);
      const timer = repeat(() => {
        const t = ctx.currentTime;
        const up = 0.8 + rand() * 1.4, down = 1.2 + rand() * 2, peak = 0.08 + rand() * 0.14;
        passGain.gain.cancelScheduledValues(t); passGain.gain.setValueAtTime(0.0001, t);
        passGain.gain.exponentialRampToValueAtTime(peak, t + up);
        passGain.gain.exponentialRampToValueAtTime(0.0001, t + up + down);
        bp.frequency.cancelScheduledValues(t); bp.frequency.setValueAtTime(700, t);
        bp.frequency.linearRampToValueAtTime(1300, t + up);
        bp.frequency.linearRampToValueAtTime(600, t + up + down);
        return 2500 + rand() * 7000;
      }, 800);
      starts.push(timer.start); stops.push(timer.stop);
      break;
    }
    case 'fan': {
      // A desk fan: motor hum with its second harmonic, and air noise chopped gently by the blades.
      const air = own(loopSource(ctx, noiseBuffer(ctx, 'brown')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.7;
      const chop = ctx.createGain();
      own(lfo(ctx, 23, 0.12, chop.gain, 0.6));
      air.connect(bp).connect(chop).connect(output);
      for (const [hz, amp] of [[60, 0.06], [120, 0.03], [180, 0.012]] as Array<[number, number]>) {
        const osc = own(ctx.createOscillator()); osc.type = 'sine'; osc.frequency.value = hz;
        const g = ctx.createGain(); g.gain.value = amp;
        osc.connect(g).connect(output);
      }
      break;
    }
    case 'clock': {
      // A wall clock: a filtered click every second, alternating between two pitches.
      const src = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 4;
      const gate = ctx.createGain(); gate.gain.value = 0;
      const level = ctx.createGain(); level.gain.value = 0.5;
      src.connect(bp).connect(gate).connect(level).connect(output);
      let tick = false;
      let next = 0;
      const timer = repeat(() => {
        const now = ctx.currentTime;
        next = Math.max(next, now) + (next === 0 ? 0.05 : 0);
        const t = next;
        bp.frequency.setValueAtTime(tick ? 2600 : 3200, t);
        gate.gain.cancelScheduledValues(t); gate.gain.setValueAtTime(0, t);
        gate.gain.linearRampToValueAtTime(1, t + 0.002);
        gate.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        tick = !tick;
        next = t + 1;
        return Math.max(50, (next - ctx.currentTime) * 1000 - 120);
      }, 0);
      starts.push(timer.start); stops.push(timer.stop);
      break;
    }
    case 'vinyl': {
      // Record surface noise: a hiss, sparse crackles, and a low wow at the speed of a 33.
      const hiss = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
      const hissGain = ctx.createGain(); hissGain.gain.value = 0.035;
      hiss.connect(hp).connect(hissGain).connect(output);
      const crackleSrc = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 1.5;
      const gate = ctx.createGain(); gate.gain.value = 0;
      crackleSrc.connect(bp).connect(gate).connect(output);
      const rand = rng(77);
      const timer = repeat(() => {
        const t = ctx.currentTime;
        const peak = 0.1 + rand() * 0.4;
        gate.gain.cancelScheduledValues(t); gate.gain.setValueAtTime(0, t);
        gate.gain.linearRampToValueAtTime(peak, t + 0.002);
        gate.gain.exponentialRampToValueAtTime(0.001, t + 0.006 + rand() * 0.012);
        return 60 + rand() * 700;
      }, 100);
      starts.push(timer.start); stops.push(timer.stop);
      const rumble = own(loopSource(ctx, noiseBuffer(ctx, 'brown')));
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 110;
      const rumbleGain = ctx.createGain();
      own(lfo(ctx, 0.55, 0.03, rumbleGain.gain, 0.07));
      rumble.connect(lp).connect(rumbleGain).connect(output);
      break;
    }
    case 'heartbeat': {
      // Lub-dub at a resting sixty beats a minute: a low sine that drops in pitch on each thump.
      const osc = own(ctx.createOscillator()); osc.type = 'sine'; osc.frequency.value = 50;
      const gate = ctx.createGain(); gate.gain.value = 0;
      const level = ctx.createGain(); level.gain.value = 0.9;
      osc.connect(gate).connect(level).connect(output);
      const thump = (t: number, amp: number) => {
        osc.frequency.cancelScheduledValues(t); osc.frequency.setValueAtTime(75, t); osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
        gate.gain.cancelScheduledValues(t); gate.gain.setValueAtTime(0.0001, t);
        gate.gain.linearRampToValueAtTime(amp, t + 0.012);
        gate.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      };
      let next = 0;
      const timer = repeat(() => {
        next = Math.max(next, ctx.currentTime + 0.05);
        thump(next, 1);
        thump(next + 0.2, 0.55);
        next += 1;
        return Math.max(50, (next - ctx.currentTime) * 1000 - 150);
      }, 0);
      starts.push(timer.start); stops.push(timer.stop);
      break;
    }
    case 'drone': {
      // A slow pad: three detuned saws an octave apart under a low-pass that breathes, and a sine an octave below.
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 360; lp.Q.value = 0.9;
      own(lfo(ctx, 0.05, 140, lp.frequency, 360));
      const level = ctx.createGain(); level.gain.value = 0.22;
      lp.connect(level).connect(output);
      for (const [hz, cents, amp] of [[55, -6, 0.5], [110, 5, 0.35], [110, -9, 0.35], [165, 7, 0.15]] as Array<[number, number, number]>) {
        const osc = own(ctx.createOscillator()); osc.type = 'sawtooth'; osc.frequency.value = hz; osc.detune.value = cents;
        const g = ctx.createGain(); g.gain.value = amp;
        osc.connect(g).connect(lp);
      }
      const sub = own(ctx.createOscillator()); sub.type = 'sine'; sub.frequency.value = 27.5;
      const subGain = ctx.createGain(); subGain.gain.value = 0.25;
      sub.connect(subGain).connect(output);
      break;
    }
    case 'space': {
      // Deep hull rumble, a tone that drifts over minutes, and a faint whistle wandering high above.
      const hull = own(loopSource(ctx, noiseBuffer(ctx, 'brown')));
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
      const hullGain = ctx.createGain();
      own(lfo(ctx, 0.04, 0.1, hullGain.gain, 0.5));
      hull.connect(lp).connect(hullGain).connect(output);
      const tone = own(ctx.createOscillator()); tone.type = 'sine';
      own(lfo(ctx, 0.017, 45, tone.frequency, 130));
      const toneGain = ctx.createGain(); toneGain.gain.value = 0.06;
      tone.connect(toneGain).connect(output);
      const whistle = own(loopSource(ctx, noiseBuffer(ctx, 'white')));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5000; bp.Q.value = 18;
      own(lfo(ctx, 0.11, 1800, bp.frequency, 5000));
      const whistleGain = ctx.createGain();
      own(lfo(ctx, 0.23, 0.02, whistleGain.gain, 0.025));
      whistle.connect(bp).connect(whistleGain).connect(output);
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
