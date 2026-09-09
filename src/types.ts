/** Built-in procedurally generated ambiences. No audio files needed. */
export type SynthPreset =
  | 'white' | 'pink' | 'brown'
  | 'rain' | 'wind' | 'fire' | 'hum'
  | 'ocean' | 'stream' | 'thunder' | 'crickets' | 'birds' | 'frogs'
  | 'drone' | 'space' | 'vinyl' | 'fan' | 'heartbeat' | 'clock' | 'city' | 'snow'
  | 'lofi' | 'pad' | 'musicbox' | 'bells';

/** Every synth preset, in catalogue order. */
export const SYNTH_PRESETS: SynthPreset[] = [
  'rain', 'wind', 'fire', 'ocean', 'stream', 'thunder', 'crickets', 'birds', 'frogs', 'snow',
  'city', 'fan', 'clock', 'vinyl', 'heartbeat', 'hum', 'drone', 'space', 'white', 'pink', 'brown',
  'lofi', 'pad', 'musicbox', 'bells',
];

export interface LayerConfig {
  /** Unique id, used to address the layer later. */
  id: string;
  /** URL of an audio file (mp3, ogg, wav...). Decoded once and cached. */
  src?: string;
  /** A synthesised ambience instead of a file. */
  synth?: SynthPreset;
  /** 0 to 1. Default 0.5. */
  volume?: number;
  /** Loop the file seamlessly. Default true. Ignored for synths, which always loop. */
  loop?: boolean;
  /** Fade duration for this layer in ms. Falls back to the engine's fadeMs. */
  fadeMs?: number;
  /** Playback rate for file layers. Default 1. */
  playbackRate?: number;
  /** Reverb send, 0 to 1. Default 0. The engine builds one shared room from a synthetic impulse. */
  reverb?: number;
}

export interface EngineOptions {
  /** 0 to 1. Default 1. */
  masterVolume?: number;
  /** Default fade for play, pause, volume changes and crossfades, in ms. Default 800. */
  fadeMs?: number;
  /** Provide your own AudioContext. Otherwise one is created lazily on first play. */
  context?: AudioContext;
  /**
   * Browsers block audio until the user interacts. The engine listens for these events once and
   * resumes the context, then starts anything that was asked to play. Pass false to manage it yourself.
   */
  unlockOn?: string[] | false;
  /** The shared reverb: tail length in seconds (default 2.6) and how fast it decays (default 3). */
  room?: { seconds?: number; decay?: number };
}

export type AmbientlyEvent = 'play' | 'pause' | 'volume' | 'layers' | 'unlock' | 'load' | 'error';

export interface LayerState {
  id: string;
  type: 'file' | 'synth';
  volume: number;
  reverb: number;
  playing: boolean;
  loading: boolean;
  error?: string;
}

export interface EngineState {
  /** True when at least one layer is audible or fading in. */
  playing: boolean;
  /** True once the AudioContext is running (after a user gesture). */
  unlocked: boolean;
  masterVolume: number;
  muted: boolean;
  layers: LayerState[];
}
