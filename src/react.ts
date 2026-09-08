import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AmbientlyEngine } from './engine';
import type { EngineOptions, EngineState, LayerConfig } from './types';

export interface UseAmbientlyOptions extends EngineOptions {
  /** Start playing as soon as the browser allows (after the first user gesture). Default false. */
  autoplay?: boolean;
}

export interface UseAmbiently extends EngineState {
  engine: AmbientlyEngine | null;
  play: (id?: string) => void;
  pause: (id?: string) => void;
  toggle: (id?: string) => void;
  setVolume: (id: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  crossfadeTo: (layers: LayerConfig[], fadeMs?: number) => void;
}

const EMPTY: EngineState = { playing: false, unlocked: false, masterVolume: 1, muted: false, layers: [] };

/**
 * React hook around AmbientlyEngine. Creates one engine per component, keeps its layers in sync with
 * the `layers` you pass, and re-renders on every engine event. Safe under SSR: nothing touches the
 * Web Audio API until the effect runs in the browser.
 */
export function useAmbiently(layers: LayerConfig[], options: UseAmbientlyOptions = {}): UseAmbiently {
  const engineRef = useRef<AmbientlyEngine | null>(null);
  const [state, setState] = useState<EngineState>(EMPTY);
  const layersKey = JSON.stringify(layers);
  const { autoplay, ...engineOptions } = options;
  const optionsRef = useRef(engineOptions);
  optionsRef.current = engineOptions;

  useEffect(() => {
    const engine = new AmbientlyEngine([], optionsRef.current);
    engineRef.current = engine;
    const update = () => setState(engine.getState());
    const offs = (['play', 'pause', 'volume', 'layers', 'unlock', 'load', 'error'] as const).map((e) => engine.on(e, update));
    update();
    return () => {
      offs.forEach((off) => off());
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const parsed: LayerConfig[] = JSON.parse(layersKey);
    void engine.crossfadeTo(parsed);
    setState(engine.getState());
  }, [layersKey]);

  useEffect(() => {
    if (!autoplay) return;
    void engineRef.current?.play();
  }, [autoplay, layersKey]);

  const play = useCallback((id?: string) => { void engineRef.current?.play(id); }, []);
  const pause = useCallback((id?: string) => engineRef.current?.pause(id), []);
  const toggle = useCallback((id?: string) => { void engineRef.current?.toggle(id); }, []);
  const setVolume = useCallback((id: string, v: number) => { engineRef.current?.setVolume(id, v); }, []);
  const setMasterVolume = useCallback((v: number) => { engineRef.current?.setMasterVolume(v); }, []);
  const mute = useCallback(() => { engineRef.current?.mute(); }, []);
  const unmute = useCallback(() => { engineRef.current?.unmute(); }, []);
  const crossfadeTo = useCallback((l: LayerConfig[], ms?: number) => { void engineRef.current?.crossfadeTo(l, ms); }, []);

  return useMemo(() => ({ engine: engineRef.current, ...state, play, pause, toggle, setVolume, setMasterVolume, mute, unmute, crossfadeTo }),
    [state, play, pause, toggle, setVolume, setMasterVolume, mute, unmute, crossfadeTo]);
}

export interface AmbientlyProps extends UseAmbientlyOptions {
  layers: LayerConfig[];
  /** Start on mount (after the first user gesture). Default true for this component. */
  autoplay?: boolean;
}

/** Headless component: drop it anywhere and the layers play. Renders nothing. */
export function Ambiently({ layers, autoplay = true, ...options }: AmbientlyProps): null {
  useAmbiently(layers, { ...options, autoplay });
  return null;
}

export type { EngineOptions, EngineState, LayerConfig, LayerState, SynthPreset, AmbientlyEvent } from './types';
export { AmbientlyEngine } from './engine';
