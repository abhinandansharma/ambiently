/* A small Web Audio API stand-in. Records automation so tests can assert on ramps. */
import { vi } from 'vitest';

class Param {
  value: number;
  calls: Array<[string, number, number?]> = [];
  constructor(v = 1) { this.value = v; }
  setValueAtTime(v: number, t: number) { this.calls.push(['set', v, t]); this.value = v; return this; }
  linearRampToValueAtTime(v: number, t: number) { this.calls.push(['linear', v, t]); this.value = v; return this; }
  exponentialRampToValueAtTime(v: number, t: number) { this.calls.push(['exp', v, t]); this.value = v; return this; }
  cancelScheduledValues() { return this; }
}
class Node {
  connections: Node[] = [];
  connect(n: Node) { this.connections.push(n); return n; }
  disconnect() { this.connections = []; }
}
class Gain extends Node { gain = new Param(1); }
class Filter extends Node { type = 'lowpass'; frequency = new Param(350); Q = new Param(1); }
class Convolver extends Node { buffer: any = null; normalize = true; }
class Analyser extends Node { fftSize = 2048; smoothingTimeConstant = 0.8; getByteFrequencyData() {} }
class Source extends Node {
  buffer: any = null; loop = false; playbackRate = new Param(1); onended: (() => void) | null = null;
  started = false; stopped = false;
  start() { this.started = true; } stop() { this.stopped = true; }
}
class Osc extends Node { type = 'sine'; frequency = new Param(440); detune = new Param(0); onended: (() => void) | null = null; started = false; start() { this.started = true; } stop() {} }
class Buffer {
  channels: Float32Array[];
  constructor(public numberOfChannels: number, public length: number, public sampleRate: number) {
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  getChannelData(i: number) { return this.channels[i]; }
}
export class MockAudioContext {
  state: 'suspended' | 'running' | 'closed' = 'suspended';
  currentTime = 0;
  sampleRate = 8000;
  destination = new Node();
  created: { sources: Source[]; gains: Gain[]; convolvers: Convolver[] } = { sources: [], gains: [], convolvers: [] };
  createGain() { const g = new Gain(); this.created.gains.push(g); return g; }
  createBiquadFilter() { return new Filter(); }
  createAnalyser() { return new Analyser(); }
  createConvolver() { const c = new Convolver(); this.created.convolvers.push(c); return c; }
  createOscillator() { return new Osc(); }
  createBufferSource() { const s = new Source(); this.created.sources.push(s); return s; }
  createBuffer(ch: number, len: number, sr: number) { return new Buffer(ch, len, sr); }
  decodeAudioData(_data: ArrayBuffer, ok: (b: any) => void) { ok(new Buffer(2, 8000, 8000)); }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; }
}
(globalThis as any).AudioContext = MockAudioContext;
(globalThis as any).fetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
