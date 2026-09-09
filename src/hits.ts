import { noiseBuffer } from './noise';

/**
 * One-shot percussive and melodic hits, synthesised on demand. No samples, no files.
 * Built for instruments and games: call `play()` inside a gesture handler and the
 * sound starts on the audio clock, optionally at a scheduled `when`.
 */
export type HitName =
  | 'kick' | 'sub' | 'tom' | 'snare' | 'rim' | 'clap' | 'hat' | 'shaker' | 'wood'
  | 'pluck' | 'bell' | 'chime' | 'stab' | 'blip' | 'zap' | 'laser' | 'sweep' | 'riser' | 'noise' | 'drop';

export const HIT_NAMES: HitName[] = [
  'kick', 'sub', 'tom', 'snare', 'rim', 'clap', 'hat', 'shaker', 'wood',
  'pluck', 'bell', 'chime', 'stab', 'blip', 'zap', 'laser', 'sweep', 'riser', 'noise', 'drop',
];

export interface HitOptions {
  /** AudioContext time to start at. Defaults to now. */
  when?: number;
  /** 0..1, scales level and, for some hits, brightness. Default 1. */
  velocity?: number;
  /** Transpose in semitones. Default 0. */
  pitch?: number;
}

export interface HitPlayer {
  /** Master output for all hits. Connect it wherever you like; by default it goes to the destination. */
  output: GainNode;
  /** Trigger a hit. Returns its length in seconds so callers can drive visuals. */
  play(name: HitName, options?: HitOptions): number;
  /** Nominal length of a hit in seconds, for animation timing. */
  duration(name: HitName): number;
}

const DURATIONS: Record<HitName, number> = {
  kick: 0.45, sub: 0.8, tom: 0.5, snare: 0.25, rim: 0.12, clap: 0.3, hat: 0.08, shaker: 0.15, wood: 0.1,
  pluck: 0.9, bell: 1.6, chime: 2.2, stab: 0.5, blip: 0.12, zap: 0.3, laser: 0.45, sweep: 0.7, riser: 1.2, noise: 0.4, drop: 0.6,
};

const semis = (n: number) => Math.pow(2, n / 12);

export function createHits(ctx: BaseAudioContext, destination: AudioNode = ctx.destination): HitPlayer {
  const output = ctx.createGain();
  output.gain.value = 0.9;
  output.connect(destination);

  /** Gain node with an attack/decay envelope, auto-disconnected when done. */
  function env(t: number, peak: number, attack: number, decay: number, curve: 'exp' | 'lin' = 'exp'): GainNode {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    else g.gain.linearRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(output);
    return g;
  }

  function osc(type: OscillatorType, freq: number, t: number, stopAt: number, dest: AudioNode, sweepTo?: number, sweepIn?: number): OscillatorNode {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (sweepTo !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(sweepTo, 1), t + (sweepIn ?? stopAt - t));
    o.connect(dest);
    o.start(t);
    o.stop(stopAt + 0.05);
    o.onended = () => { o.disconnect(); dest.disconnect(); };
    return o;
  }

  function noise(t: number, stopAt: number, dest: AudioNode, kind: 'white' | 'pink' | 'brown' = 'white'): AudioBufferSourceNode {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuffer(ctx, kind);
    s.loop = true;
    s.connect(dest);
    s.start(t, Math.random() * 2);
    s.stop(stopAt + 0.05);
    s.onended = () => { s.disconnect(); dest.disconnect(); };
    return s;
  }

  function filter(type: BiquadFilterType, freq: number, q: number, dest: AudioNode): BiquadFilterNode {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    f.connect(dest);
    return f;
  }

  const voices: Record<HitName, (t: number, v: number, p: number) => void> = {
    kick(t, v) {
      const g = env(t, 1.1 * v, 0.002, 0.42);
      osc('sine', 150, t, t + 0.45, g, 42, 0.12);
      const click = env(t, 0.35 * v, 0.001, 0.02);
      noise(t, t + 0.03, filter('highpass', 2500, 0.7, click));
    },
    sub(t, v, p) {
      const g = env(t, 0.9 * v, 0.01, 0.8);
      osc('sine', 55 * p, t, t + 0.8, g, 48 * p, 0.6);
    },
    tom(t, v, p) {
      const g = env(t, 0.9 * v, 0.003, 0.5);
      osc('sine', 220 * p, t, t + 0.5, g, 95 * p, 0.3);
      const n = env(t, 0.15 * v, 0.001, 0.05);
      noise(t, t + 0.06, filter('bandpass', 1800, 1, n));
    },
    snare(t, v) {
      const body = env(t, 0.6 * v, 0.002, 0.14);
      osc('triangle', 190, t, t + 0.15, body, 120, 0.1);
      const n = env(t, 0.8 * v, 0.001, 0.25);
      noise(t, t + 0.3, filter('highpass', 1600, 0.8, n));
    },
    rim(t, v) {
      const g = env(t, 0.7 * v, 0.001, 0.12);
      osc('square', 1800, t, t + 0.12, filter('bandpass', 1800, 6, g));
    },
    clap(t, v) {
      for (let i = 0; i < 3; i++) {
        const g = env(t + i * 0.012, 0.45 * v, 0.001, 0.04);
        noise(t + i * 0.012, t + i * 0.012 + 0.05, filter('bandpass', 1400, 1.2, g));
      }
      const tail = env(t + 0.036, 0.5 * v, 0.001, 0.26);
      noise(t + 0.036, t + 0.3, filter('bandpass', 1300, 0.9, tail));
    },
    hat(t, v) {
      const g = env(t, 0.5 * v, 0.001, 0.08);
      noise(t, t + 0.09, filter('highpass', 7000, 0.7, g));
    },
    shaker(t, v) {
      const g = env(t, 0.4 * v, 0.03, 0.12, 'lin');
      noise(t, t + 0.16, filter('bandpass', 5500, 2, g), 'pink');
    },
    wood(t, v, p) {
      const g = env(t, 0.9 * v, 0.001, 0.1);
      osc('sine', 820 * p, t, t + 0.1, filter('bandpass', 820 * p, 8, g), 700 * p, 0.08);
    },
    pluck(t, v, p) {
      const g = env(t, 0.7 * v, 0.002, 0.9);
      const f = filter('lowpass', 2400 * Math.max(v, 0.3), 1, g);
      f.frequency.exponentialRampToValueAtTime(220, t + 0.7);
      osc('sawtooth', 220 * p, t, t + 0.9, f);
      osc('square', 220 * p * 1.005, t, t + 0.9, f).connect(f);
    },
    bell(t, v, p) {
      const base = 660 * p;
      [1, 2.76, 5.4].forEach((ratio, i) => {
        const g = env(t, (0.5 / (i + 1)) * v, 0.002, 1.6 - i * 0.4);
        osc('sine', base * ratio, t, t + 1.6, g);
      });
    },
    chime(t, v, p) {
      const base = 1320 * p;
      [1, 1.5, 2.0, 3.01].forEach((ratio, i) => {
        const g = env(t + i * 0.01, (0.35 / (i + 1)) * v, 0.003, 2.2 - i * 0.3);
        osc('triangle', base * ratio, t + i * 0.01, t + 2.2, g);
      });
    },
    stab(t, v, p) {
      const g = env(t, 0.55 * v, 0.005, 0.5);
      const f = filter('lowpass', 3200, 2, g);
      f.frequency.exponentialRampToValueAtTime(300, t + 0.5);
      [0, 4, 7].forEach((interval) => {
        osc('sawtooth', 165 * p * semis(interval), t, t + 0.5, f);
        osc('sawtooth', 165 * p * semis(interval) * 1.006, t, t + 0.5, f);
      });
    },
    blip(t, v, p) {
      const g = env(t, 0.6 * v, 0.001, 0.12);
      osc('square', 880 * p, t, t + 0.12, filter('lowpass', 4000, 0.7, g));
    },
    zap(t, v, p) {
      const g = env(t, 0.7 * v, 0.001, 0.3);
      osc('sawtooth', 1800 * p, t, t + 0.3, filter('lowpass', 3500, 1, g), 120 * p, 0.28);
    },
    laser(t, v, p) {
      const g = env(t, 0.6 * v, 0.001, 0.45);
      osc('square', 2400 * p, t, t + 0.45, filter('bandpass', 1500, 2, g), 60 * p, 0.42);
    },
    sweep(t, v, p) {
      const g = env(t, 0.5 * v, 0.02, 0.7, 'lin');
      const f = filter('lowpass', 200, 4, g);
      f.frequency.exponentialRampToValueAtTime(6000 * Math.max(v, 0.3), t + 0.6);
      osc('sawtooth', 110 * p, t, t + 0.7, f);
    },
    riser(t, v, p) {
      const g = env(t, 0.5 * v, 0.6, 0.6, 'lin');
      osc('sawtooth', 110 * p, t, t + 1.2, filter('bandpass', 900, 3, g), 880 * p, 1.1);
      const n = env(t, 0.25 * v, 0.9, 0.3, 'lin');
      noise(t, t + 1.2, filter('highpass', 3000, 0.7, n), 'pink');
    },
    noise(t, v) {
      const g = env(t, 0.6 * v, 0.002, 0.4);
      const f = filter('bandpass', 2500, 0.6, g);
      f.frequency.exponentialRampToValueAtTime(300, t + 0.4);
      noise(t, t + 0.45, f);
    },
    drop(t, v, p) {
      const g = env(t, 0.8 * v, 0.002, 0.6);
      osc('sine', 900 * p, t, t + 0.6, g, 40 * p, 0.55);
    },
  };

  return {
    output,
    duration: (name) => DURATIONS[name],
    play(name, options = {}) {
      const t = Math.max(options.when ?? ctx.currentTime, ctx.currentTime);
      const v = Math.min(Math.max(options.velocity ?? 1, 0.05), 1);
      const p = semis(options.pitch ?? 0);
      voices[name](t, v, p);
      return DURATIONS[name];
    },
  };
}
