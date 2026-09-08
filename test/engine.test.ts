import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AmbientlyEngine } from '../src/engine';
import { MockAudioContext } from './setup';

const mk = (layers: any[] = [], opts: any = {}) => {
  const ctx = new MockAudioContext();
  const engine = new AmbientlyEngine(layers, { context: ctx as unknown as AudioContext, fadeMs: 100, unlockOn: false, ...opts });
  return { ctx, engine };
};

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('AmbientlyEngine', () => {
  it('registers layers and reports state', () => {
    const { engine } = mk([{ id: 'rain', synth: 'rain', volume: 0.3 }, { id: 'music', src: '/a.mp3' }]);
    const s = engine.getState();
    expect(s.layers.map((l) => l.id)).toEqual(['rain', 'music']);
    expect(s.layers[0]).toMatchObject({ type: 'synth', volume: 0.3, playing: false });
    expect(s.layers[1]).toMatchObject({ type: 'file', volume: 0.5 });
    expect(s.playing).toBe(false);
  });

  it('rejects layers without an id or a source', () => {
    const { engine } = mk();
    expect(() => engine.add({ id: '', synth: 'rain' })).toThrow();
    expect(() => engine.add({ id: 'x' } as any)).toThrow();
  });

  it('play() resumes the context, starts sources and fades gains in', async () => {
    const { ctx, engine } = mk([{ id: 'music', src: '/a.mp3', volume: 0.8 }, { id: 'wind', synth: 'wind' }]);
    await engine.play();
    expect(ctx.state).toBe('running');
    expect(engine.getState().playing).toBe(true);
    const fileSource = ctx.created.sources.find((s) => s.loop && s.started && s.buffer);
    expect(fileSource).toBeTruthy();
    const layerGain = ctx.created.gains.find((g) => g.gain.calls.some((c) => c[0] === 'linear' && c[1] === 0.8));
    expect(layerGain).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith('/a.mp3');
  });

  it('pause() ramps to zero, then stops sources after the fade', async () => {
    const { ctx, engine } = mk([{ id: 'music', src: '/b.mp3' }]);
    await engine.play();
    const src = ctx.created.sources[0];
    engine.pause();
    expect(engine.getState().playing).toBe(false);
    expect(src.stopped).toBe(false);
    vi.advanceTimersByTime(200);
    expect(src.stopped).toBe(true);
  });

  it('resuming during a fade-out keeps the source alive', async () => {
    const { ctx, engine } = mk([{ id: 'music', src: '/c.mp3' }]);
    await engine.play();
    const src = ctx.created.sources[0];
    engine.pause();
    await engine.play();
    vi.advanceTimersByTime(300);
    expect(src.stopped).toBe(false);
  });

  it('setVolume clamps and ramps when playing', async () => {
    const { ctx, engine } = mk([{ id: 'hum', synth: 'hum' }]);
    await engine.play();
    engine.setVolume('hum', 1.7);
    expect(engine.getState().layers[0].volume).toBe(1);
    const ramped = ctx.created.gains.some((g) => g.gain.calls.some((c) => c[0] === 'linear' && c[1] === 1));
    expect(ramped).toBe(true);
  });

  it('master volume and mute act on the master bus', async () => {
    const { ctx, engine } = mk([{ id: 'pink', synth: 'pink' }], { masterVolume: 0.6 });
    await engine.play();
    const master = ctx.created.gains[0];
    engine.mute();
    expect(master.gain.value).toBe(0);
    engine.unmute();
    expect(master.gain.value).toBe(0.6);
    engine.setMasterVolume(0.2);
    expect(master.gain.value).toBe(0.2);
    expect(engine.getState()).toMatchObject({ masterVolume: 0.2, muted: false });
  });

  it('crossfadeTo swaps the layer set', async () => {
    const { engine } = mk([{ id: 'rain', synth: 'rain' }, { id: 'fire', synth: 'fire' }]);
    await engine.play();
    await engine.crossfadeTo([{ id: 'fire', synth: 'fire', volume: 0.9 }, { id: 'wind', synth: 'wind' }]);
    const ids = engine.getState().layers.map((l) => l.id);
    expect(ids).toEqual(['fire', 'wind']);
    expect(engine.getState().layers[0].volume).toBe(0.9);
    expect(engine.getState().playing).toBe(true);
  });

  it('crossfadeTo keeps playing when every layer is replaced', async () => {
    const { engine } = mk([{ id: 'rain', synth: 'rain' }]);
    await engine.play();
    await engine.crossfadeTo([{ id: 'fire', synth: 'fire' }, { id: 'hum', synth: 'hum' }]);
    expect(engine.getState().playing).toBe(true);
    expect(engine.getState().layers.every((l) => l.playing)).toBe(true);
  });

  it('crossfadeTo on an idle engine stays idle', () => {
    const { engine } = mk();
    void engine.crossfadeTo([{ id: 'fire', synth: 'fire' }]);
    expect(engine.getState().playing).toBe(false);
  });

  it('emits events with the current state', async () => {
    const { engine } = mk([{ id: 'rain', synth: 'rain' }]);
    const seen: string[] = [];
    engine.on('play', (s) => seen.push(`play:${s.playing}`));
    engine.on('pause', (s) => seen.push(`pause:${s.playing}`));
    await engine.play();
    engine.pause();
    expect(seen).toEqual(['play:true', 'pause:false']);
  });

  it('records a load error instead of throwing', async () => {
    (fetch as any).mockImplementationOnce(async () => ({ ok: false, status: 404 }));
    const { engine } = mk([{ id: 'missing', src: '/nope.mp3' }]);
    await engine.play();
    const l = engine.getState().layers[0];
    expect(l.playing).toBe(false);
    expect(l.error).toMatch(/404/);
  });

  it('destroy() stops everything and closes the context', async () => {
    const { ctx, engine } = mk([{ id: 'brown', synth: 'brown' }]);
    await engine.play();
    engine.destroy();
    expect(ctx.state).toBe('closed');
    expect(engine.getState().layers).toEqual([]);
  });
});
