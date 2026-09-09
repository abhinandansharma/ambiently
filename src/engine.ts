import type { AmbientlyEvent, EngineOptions, EngineState, LayerConfig, LayerState } from './types';
import { createSynth, type SynthVoice } from './synth';

interface Layer {
  config: LayerConfig;
  gain: GainNode | null;
  send: GainNode | null; // to the shared reverb
  source: AudioBufferSourceNode | null;
  synth: SynthVoice | null;
  buffer: AudioBuffer | null;
  wanted: boolean; // asked to play
  playing: boolean; // audibly running
  loading: boolean;
  error?: string;
  stopTimer?: ReturnType<typeof setTimeout>;
}

type Listener = (state: EngineState) => void;

const DEFAULT_UNLOCK = ['pointerdown', 'keydown', 'touchstart'];
const bufferCache = new Map<string, Promise<AudioBuffer>>();

/**
 * Ambient sound engine on top of the Web Audio API.
 * Layers are files or synthesised presets, each with its own gain. Every change is a gain ramp,
 * so nothing clicks. The AudioContext is created lazily and resumed on the first user gesture.
 */
export class AmbientlyEngine {
  private ctx: AudioContext | null;
  private master: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private analyser: AnalyserNode | null = null;
  private room: { seconds: number; decay: number };
  private layers = new Map<string, Layer>();
  private listeners = new Map<AmbientlyEvent, Set<Listener>>();
  private masterVolume: number;
  private muted = false;
  private fadeMs: number;
  private unlockEvents: string[] | false;
  private unlockHandler: (() => void) | null = null;
  private destroyed = false;

  constructor(layers: LayerConfig[] = [], options: EngineOptions = {}) {
    this.ctx = options.context ?? null;
    this.masterVolume = clamp(options.masterVolume ?? 1);
    this.fadeMs = options.fadeMs ?? 800;
    this.room = { seconds: options.room?.seconds ?? 2.6, decay: options.room?.decay ?? 3 };
    this.unlockEvents = options.unlockOn === undefined ? DEFAULT_UNLOCK : options.unlockOn;
    layers.forEach((l) => this.add(l));
    if (this.ctx) this.attachContext(this.ctx);
  }

  // ── layers ────────────────────────────────────────────────────────────

  /** Register a layer. Plays immediately if the engine is already playing. */
  add(config: LayerConfig): this {
    if (!config.id) throw new Error('ambiently: a layer needs an id');
    if (!config.src && !config.synth) throw new Error(`ambiently: layer "${config.id}" needs a src or a synth`);
    const existing = this.layers.get(config.id);
    if (existing) {
      existing.config = { ...existing.config, ...config };
      if (existing.gain && existing.playing) this.ramp(existing.gain.gain, existing.config.volume ?? 0.5, config.fadeMs ?? this.fadeMs);
      if (config.reverb !== undefined) this.applyReverb(existing, config.fadeMs ?? this.fadeMs);
      this.emit('layers');
      return this;
    }
    const layer: Layer = { config: { volume: 0.5, loop: true, reverb: 0, ...config }, gain: null, send: null, source: null, synth: null, buffer: null, wanted: false, playing: false, loading: false };
    this.layers.set(config.id, layer);
    if (this.isPlaying()) void this.play(config.id);
    this.emit('layers');
    return this;
  }

  /** Fade a layer out and forget it. */
  remove(id: string, fadeMs?: number): this {
    const layer = this.layers.get(id);
    if (!layer) return this;
    this.pauseLayer(layer, fadeMs);
    this.layers.delete(id);
    this.emit('layers');
    return this;
  }

  /** Replace the whole set of layers, fading out what is gone and fading in what is new. */
  crossfadeTo(layers: LayerConfig[], fadeMs?: number): Promise<void> {
    const wasPlaying = this.isPlaying();
    const keep = new Set(layers.map((l) => l.id));
    for (const id of Array.from(this.layers.keys())) if (!keep.has(id)) this.remove(id, fadeMs);
    layers.forEach((l) => this.add({ fadeMs, ...l }));
    return wasPlaying ? this.play() : Promise.resolve();
  }

  // ── transport ─────────────────────────────────────────────────────────

  /** Start one layer, or all of them. Resolves once sources are running (or once unlocked). */
  async play(id?: string): Promise<void> {
    const targets = id ? [this.layers.get(id)].filter(Boolean) as Layer[] : Array.from(this.layers.values());
    targets.forEach((l) => { l.wanted = true; });
    const ctx = this.ensureContext();
    await this.resume(ctx);
    if (this.destroyed) return;
    await Promise.all(targets.map((l) => this.startLayer(l, ctx)));
    this.emit('play');
  }

  /** Fade one layer, or all, to silence and stop the sources. */
  pause(id?: string, fadeMs?: number): void {
    const targets = id ? [this.layers.get(id)].filter(Boolean) as Layer[] : Array.from(this.layers.values());
    targets.forEach((l) => this.pauseLayer(l, fadeMs));
    this.emit('pause');
  }

  toggle(id?: string): Promise<void> | void {
    if (id) {
      const l = this.layers.get(id);
      if (!l) return;
      return l.wanted ? this.pause(id) : this.play(id);
    }
    return this.isPlaying() ? this.pause() : this.play();
  }

  /** Alias of pause() for symmetry with play(). */
  stop(): void { this.pause(); }

  // ── volume ────────────────────────────────────────────────────────────

  setVolume(id: string, volume: number, fadeMs?: number): this {
    const layer = this.layers.get(id);
    if (!layer) return this;
    layer.config.volume = clamp(volume);
    if (layer.gain && layer.playing) this.ramp(layer.gain.gain, layer.config.volume, fadeMs ?? layer.config.fadeMs ?? this.fadeMs);
    this.emit('volume');
    return this;
  }

  /** How much of a layer goes to the shared reverb, 0 to 1. */
  setReverb(id: string, amount: number, fadeMs?: number): this {
    const layer = this.layers.get(id);
    if (!layer) return this;
    layer.config.reverb = clamp(amount);
    this.applyReverb(layer, fadeMs ?? layer.config.fadeMs ?? this.fadeMs);
    this.emit('volume');
    return this;
  }

  setMasterVolume(volume: number, fadeMs?: number): this {
    this.masterVolume = clamp(volume);
    if (this.master && !this.muted) this.ramp(this.master.gain, this.masterVolume, fadeMs ?? this.fadeMs);
    this.emit('volume');
    return this;
  }

  mute(fadeMs?: number): this {
    this.muted = true;
    if (this.master) this.ramp(this.master.gain, 0, fadeMs ?? this.fadeMs);
    this.emit('volume');
    return this;
  }

  unmute(fadeMs?: number): this {
    this.muted = false;
    if (this.master) this.ramp(this.master.gain, this.masterVolume, fadeMs ?? this.fadeMs);
    this.emit('volume');
    return this;
  }

  // ── introspection ─────────────────────────────────────────────────────

  isPlaying(): boolean {
    for (const l of this.layers.values()) if (l.wanted) return true;
    return false;
  }

  getState(): EngineState {
    const layers: LayerState[] = Array.from(this.layers.values()).map((l) => ({
      id: l.config.id,
      type: l.config.synth ? 'synth' : 'file',
      volume: l.config.volume ?? 0.5,
      reverb: l.config.reverb ?? 0,
      playing: l.wanted,
      loading: l.loading,
      error: l.error,
    }));
    return { playing: this.isPlaying(), unlocked: this.ctx?.state === 'running', masterVolume: this.masterVolume, muted: this.muted, layers };
  }

  /** An AnalyserNode fed by the master bus, for visualisers. Created on demand. */
  getAnalyser(fftSize = 256): AnalyserNode {
    const ctx = this.ensureContext();
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = fftSize;
      this.analyser.smoothingTimeConstant = 0.85;
      this.master!.connect(this.analyser);
    }
    return this.analyser;
  }

  /** The underlying AudioContext, created if needed. */
  get context(): AudioContext { return this.ensureContext(); }

  on(event: AmbientlyEvent, listener: Listener): () => void {
    let set = this.listeners.get(event);
    if (!set) { set = new Set(); this.listeners.set(event, set); }
    set.add(listener);
    return () => { set!.delete(listener); };
  }

  /** Resume the context now (call from inside a user gesture handler if you manage unlocking yourself). */
  async unlock(): Promise<boolean> {
    const ctx = this.ensureContext();
    await this.resume(ctx);
    return ctx.state === 'running';
  }

  /** Stop everything, close the context and drop listeners. The instance is unusable afterwards. */
  destroy(): void {
    this.destroyed = true;
    for (const l of this.layers.values()) this.killLayer(l);
    this.layers.clear();
    this.detachUnlock();
    this.listeners.clear();
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close().catch(() => undefined);
    this.ctx = null;
    this.master = null;
    this.reverb = null;
    this.analyser = null;
  }

  // ── internals ─────────────────────────────────────────────────────────

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') throw new Error('ambiently: AudioContext is only available in the browser');
    const Ctor: typeof AudioContext = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) throw new Error('ambiently: Web Audio API is not supported here');
    const ctx = new Ctor();
    this.attachContext(ctx);
    return ctx;
  }

  private attachContext(ctx: AudioContext): void {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.masterVolume;
    this.master.connect(ctx.destination);
    if (this.unlockEvents && typeof window !== 'undefined') {
      this.unlockHandler = () => { void this.resume(ctx); };
      this.unlockEvents.forEach((e) => window.addEventListener(e, this.unlockHandler!, { passive: true }));
    }
  }

  private detachUnlock(): void {
    if (this.unlockHandler && this.unlockEvents && typeof window !== 'undefined') {
      this.unlockEvents.forEach((e) => window.removeEventListener(e, this.unlockHandler!));
    }
    this.unlockHandler = null;
  }

  private async resume(ctx: AudioContext): Promise<void> {
    if (stateOf(ctx) === 'running') return;
    try { await ctx.resume(); } catch { /* still locked, a gesture listener will retry */ }
    if (stateOf(ctx) === 'running') {
      this.detachUnlock();
      this.emit('unlock');
      // start anything that was requested while locked
      const pending: Promise<void>[] = [];
      for (const l of this.layers.values()) if (l.wanted && !l.playing && !l.loading) pending.push(this.startLayer(l, ctx));
      await Promise.all(pending);
    }
  }

  private async loadBuffer(ctx: AudioContext, src: string): Promise<AudioBuffer> {
    const key = `${src}`;
    let p = bufferCache.get(key);
    if (!p) {
      p = fetch(src).then(async (r) => {
        if (!r.ok) throw new Error(`ambiently: ${r.status} loading ${src}`);
        const data = await r.arrayBuffer();
        return await new Promise<AudioBuffer>((res, rej) => { void ctx.decodeAudioData(data, res, rej); });
      });
      bufferCache.set(key, p);
      p.catch(() => bufferCache.delete(key));
    }
    return p;
  }

  private async startLayer(layer: Layer, ctx: AudioContext): Promise<void> {
    if (!layer.wanted || layer.playing || layer.loading || ctx.state !== 'running') return;
    if (layer.stopTimer) { clearTimeout(layer.stopTimer); layer.stopTimer = undefined; }
    const target = layer.config.volume ?? 0.5;
    const fade = layer.config.fadeMs ?? this.fadeMs;
    try {
      if (!layer.gain) {
        layer.gain = ctx.createGain();
        layer.gain.gain.value = 0;
        layer.gain.connect(this.master!);
      }
      if ((layer.config.reverb ?? 0) > 0 && !layer.send) this.applyReverb(layer, 0);
      if (layer.config.synth) {
        if (!layer.synth) {
          layer.synth = createSynth(ctx, layer.config.synth);
          layer.synth.output.connect(layer.gain);
        }
        layer.synth.start();
      } else {
        layer.loading = true;
        this.emit('load');
        if (!layer.buffer) layer.buffer = await this.loadBuffer(ctx, layer.config.src!);
        layer.loading = false;
        if (!layer.wanted || this.destroyed) return; // paused while loading
        const source = ctx.createBufferSource();
        source.buffer = layer.buffer;
        source.loop = layer.config.loop !== false;
        source.playbackRate.value = layer.config.playbackRate ?? 1;
        source.connect(layer.gain);
        source.onended = () => { if (layer.source === source && !source.loop) { layer.wanted = false; layer.playing = false; this.emit('pause'); } };
        source.start();
        layer.source = source;
      }
      layer.playing = true;
      layer.error = undefined;
      this.ramp(layer.gain.gain, target, fade);
      this.emit('load');
    } catch (err) {
      layer.loading = false;
      layer.wanted = false;
      layer.error = err instanceof Error ? err.message : String(err);
      this.emit('error');
    }
  }

  private pauseLayer(layer: Layer, fadeMs?: number): void {
    layer.wanted = false;
    if (!layer.gain || !layer.playing) return;
    const fade = fadeMs ?? layer.config.fadeMs ?? this.fadeMs;
    this.ramp(layer.gain.gain, 0, fade);
    if (layer.stopTimer) clearTimeout(layer.stopTimer);
    layer.stopTimer = setTimeout(() => {
      if (layer.wanted) return; // resumed during the fade
      this.stopSources(layer);
    }, fade + 30);
    layer.playing = false;
  }

  private stopSources(layer: Layer): void {
    if (layer.source) { try { layer.source.stop(); } catch { /* not started */ } layer.source.disconnect(); layer.source = null; }
    if (layer.synth) { layer.synth.stop(); layer.synth.output.disconnect(); layer.synth = null; }
    layer.playing = false;
  }

  private killLayer(layer: Layer): void {
    if (layer.stopTimer) clearTimeout(layer.stopTimer);
    this.stopSources(layer);
    if (layer.send) { layer.send.disconnect(); layer.send = null; }
    if (layer.gain) { layer.gain.disconnect(); layer.gain = null; }
    layer.wanted = false;
  }

  /** The shared reverb: a convolver fed by a synthetic impulse (decaying noise), built on first use. */
  private ensureReverb(ctx: AudioContext): ConvolverNode {
    if (this.reverb) return this.reverb;
    const { seconds, decay } = this.room;
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let seed = 11 + ch * 17;
      for (let i = 0; i < length; i++) {
        seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0;
        const r = seed / 4294967296 * 2 - 1;
        data[i] = r * Math.pow(1 - i / length, decay);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    convolver.connect(this.master!);
    this.reverb = convolver;
    return convolver;
  }

  /** Point a layer's send at the shared reverb at its configured amount. Creates the send lazily. */
  private applyReverb(layer: Layer, fadeMs: number): void {
    const amount = layer.config.reverb ?? 0;
    if (!layer.gain || !this.ctx) return; // applied when the layer starts
    if (!layer.send) {
      if (amount <= 0) return;
      layer.send = this.ctx.createGain();
      layer.send.gain.value = 0;
      layer.gain.connect(layer.send);
      layer.send.connect(this.ensureReverb(this.ctx));
    }
    this.ramp(layer.send.gain, amount, fadeMs);
  }

  private ramp(param: AudioParam, target: number, ms: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(target, now + Math.max(0.005, ms / 1000));
  }

  private emit(event: AmbientlyEvent): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;
    const state = this.getState();
    set.forEach((l) => l(state));
  }
}

function stateOf(ctx: AudioContext): AudioContextState { return ctx.state; }

function clamp(v: number): number { return Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0)); }
