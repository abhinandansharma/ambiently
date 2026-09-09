'use client';
import { useMemo, useState } from 'react';
import { useAmbiently } from 'ambiently/react';
import type { LayerConfig, SynthPreset } from 'ambiently';
import Visualizer from './Visualizer';

type Kind = 'recording' | 'synth' | 'music';
type Sound = { id: string; name: string; note: string; kind: Kind; file?: string; synth?: SynthPreset; volume: number };

/** Every sound the demo ships. Recordings are CC0 field recordings cut to seamless loops; synths are generated in the browser. */
export const CATALOG: Sound[] = [
  // recordings
  { id: 'rain-rec', name: 'Soft rain', note: 'Steady rain on leaves', kind: 'recording', file: 'rain.m4a', volume: 0.5 },
  { id: 'rain-heavy', name: 'Heavy rain', note: 'A downpour, close', kind: 'recording', file: 'rain-heavy.m4a', volume: 0.5 },
  { id: 'thunder', name: 'Thunder', note: 'Distant rolling storm', kind: 'recording', file: 'thunder.m4a', volume: 0.6 },
  { id: 'wind-rec', name: 'Wind at the window', note: 'Howling through a crack', kind: 'recording', file: 'wind.m4a', volume: 0.3 },
  { id: 'ocean', name: 'Ocean waves', note: 'Waves of Hawaii', kind: 'recording', file: 'ocean.m4a', volume: 0.6 },
  { id: 'harbour', name: 'Harbour gulls', note: 'Gulls and water at the quay', kind: 'recording', file: 'harbour.m4a', volume: 0.45 },
  { id: 'underwater', name: 'Deep sea', note: 'Below the surface', kind: 'recording', file: 'underwater.m4a', volume: 0.45 },
  { id: 'stream-rec', name: 'Mountain stream', note: 'Water up close over stones', kind: 'recording', file: 'stream.m4a', volume: 0.5 },
  { id: 'waterfall', name: 'Waterfall', note: 'A steady fall in the hills', kind: 'recording', file: 'waterfall.m4a', volume: 0.5 },
  { id: 'forest', name: 'Forest birds', note: 'Czech woods, early morning', kind: 'recording', file: 'forest.m4a', volume: 0.5 },
  { id: 'jungle', name: 'Rainforest', note: 'Bako National Park, Borneo', kind: 'recording', file: 'jungle.m4a', volume: 0.5 },
  { id: 'meadow', name: 'Summer meadow', note: 'Insects and birds in tall grass', kind: 'recording', file: 'meadow.m4a', volume: 0.5 },
  { id: 'night', name: 'Crickets at night', note: 'Summer night outside', kind: 'recording', file: 'night.m4a', volume: 0.5 },
  { id: 'frogs-rec', name: 'Frogs', note: 'A pond after dark', kind: 'recording', file: 'frogs.m4a', volume: 0.45 },
  { id: 'fireplace', name: 'Fireplace', note: 'Fire in a stove', kind: 'recording', file: 'fireplace.m4a', volume: 0.6 },
  { id: 'cafe', name: 'Café chatter', note: 'Bustling café room tone', kind: 'recording', file: 'cafe.m4a', volume: 0.35 },
  { id: 'market', name: 'Farmers market', note: 'A crowd on a Saturday morning', kind: 'recording', file: 'market.m4a', volume: 0.35 },
  { id: 'typing', name: 'Keyboard', note: 'Mechanical keys, someone working', kind: 'recording', file: 'typing.m4a', volume: 0.3 },
  { id: 'fan-rec', name: 'Air conditioner', note: 'A room with the fan running', kind: 'recording', file: 'fan.m4a', volume: 0.4 },
  { id: 'purr', name: 'Cat purring', note: 'A contented cat', kind: 'recording', file: 'purr.m4a', volume: 0.4 },
  { id: 'chimes', name: 'Wind chimes', note: 'Chimes in a light breeze', kind: 'recording', file: 'chimes.m4a', volume: 0.3 },
  { id: 'city-rec', name: 'City at night', note: 'Traffic from a balcony', kind: 'recording', file: 'city.m4a', volume: 0.4 },
  { id: 'train', name: 'Train ride', note: 'Inside a moving carriage', kind: 'recording', file: 'train.m4a', volume: 0.45 },
  { id: 'airplane', name: 'Airplane cabin', note: 'Cruising altitude', kind: 'recording', file: 'airplane.m4a', volume: 0.45 },
  // music
  { id: 'lofi', name: 'Lo-fi beat', note: 'Relaxed hip-hop loop', kind: 'music', file: 'lofi-relax-beat.mp3', volume: 0.45 },
  { id: 'piano', name: 'Piano loop', note: 'Soft piano phrase', kind: 'music', file: 'piano-loop.mp3', volume: 0.3 },
  // synths
  { id: 'rain', name: 'Rain', note: 'Pink noise, high-pass, slow swell', kind: 'synth', synth: 'rain', volume: 0.3 },
  { id: 'wind', name: 'Wind', note: 'Brown noise, wandering band-pass', kind: 'synth', synth: 'wind', volume: 0.25 },
  { id: 'fire', name: 'Fire', note: 'Rumble plus gated crackles', kind: 'synth', synth: 'fire', volume: 0.35 },
  { id: 'ocean-synth', name: 'Ocean', note: 'Swells that breathe, foam on top', kind: 'synth', synth: 'ocean', volume: 0.35 },
  { id: 'stream-synth', name: 'Stream', note: 'Fluttering band-pass babble', kind: 'synth', synth: 'stream', volume: 0.3 },
  { id: 'thunder-synth', name: 'Thunder', note: 'A far rumble with rolls now and then', kind: 'synth', synth: 'thunder', volume: 0.4 },
  { id: 'crickets', name: 'Crickets', note: 'Two crickets pulsing at 40 Hz', kind: 'synth', synth: 'crickets', volume: 0.3 },
  { id: 'birds', name: 'Birds', note: 'Sine-sweep phrases, near and far', kind: 'synth', synth: 'birds', volume: 0.3 },
  { id: 'frogs-synth', name: 'Frogs', note: 'Pulsed square-wave croaks', kind: 'synth', synth: 'frogs', volume: 0.3 },
  { id: 'snow', name: 'Blizzard', note: 'Harder gusts and a whistle', kind: 'synth', synth: 'snow', volume: 0.3 },
  { id: 'city-synth', name: 'Traffic', note: 'A rumble bed and cars passing', kind: 'synth', synth: 'city', volume: 0.3 },
  { id: 'fan-synth', name: 'Desk fan', note: 'Motor hum and chopped air', kind: 'synth', synth: 'fan', volume: 0.25 },
  { id: 'clock', name: 'Clock', note: 'A tick and a tock every second', kind: 'synth', synth: 'clock', volume: 0.2 },
  { id: 'vinyl', name: 'Vinyl', note: 'Hiss, crackle and a 33 rpm wow', kind: 'synth', synth: 'vinyl', volume: 0.35 },
  { id: 'heartbeat', name: 'Heartbeat', note: 'Sixty a minute, lub-dub', kind: 'synth', synth: 'heartbeat', volume: 0.3 },
  { id: 'hum', name: 'Hum', note: '50 Hz with harmonics', kind: 'synth', synth: 'hum', volume: 0.1 },
  { id: 'drone', name: 'Drone', note: 'Detuned saws under a slow filter', kind: 'synth', synth: 'drone', volume: 0.25 },
  { id: 'space', name: 'Space', note: 'Hull rumble and a drifting tone', kind: 'synth', synth: 'space', volume: 0.35 },
  { id: 'white', name: 'White noise', note: 'Flat spectrum', kind: 'synth', synth: 'white', volume: 0.15 },
  { id: 'pink', name: 'Pink noise', note: 'Equal energy per octave', kind: 'synth', synth: 'pink', volume: 0.2 },
  { id: 'brown', name: 'Brown noise', note: 'Deep, like a distant waterfall', kind: 'synth', synth: 'brown', volume: 0.25 },
];
const NAMES: Record<string, Sound> = Object.fromEntries(CATALOG.map((c) => [c.id, c]));
const KIND_LABEL: Record<Kind, string> = { recording: 'Recording · CC0', synth: 'Synth · no file', music: 'Music · CC0' };

/** Scenes as sound ids with volumes. Grouped so the row of pills stays readable. */
export const SCENES: { group: string; scenes: { name: string; mix: Array<[string, number]> }[] }[] = [
  { group: 'Outdoors', scenes: [
    { name: 'Storm', mix: [['thunder', 0.7], ['rain-heavy', 0.55], ['wind', 0.35]] },
    { name: 'Beach', mix: [['ocean', 0.7], ['harbour', 0.2], ['wind-rec', 0.12]] },
    { name: 'Forest morning', mix: [['forest', 0.6], ['stream-rec', 0.25], ['rain', 0.1]] },
    { name: 'Mountain stream', mix: [['stream-rec', 0.55], ['birds', 0.25], ['wind', 0.1]] },
    { name: 'Waterfall', mix: [['waterfall', 0.6], ['forest', 0.25]] },
    { name: 'Rainforest', mix: [['jungle', 0.6], ['rain-rec', 0.25], ['frogs-synth', 0.12]] },
    { name: 'Summer meadow', mix: [['meadow', 0.55], ['chimes', 0.15]] },
    { name: 'Pond at dusk', mix: [['frogs-rec', 0.5], ['night', 0.4], ['crickets', 0.12]] },
    { name: 'Blizzard', mix: [['snow', 0.5], ['wind-rec', 0.25], ['fireplace', 0.3]] },
  ] },
  { group: 'Indoors', scenes: [
    { name: 'Rainy café', mix: [['rain-rec', 0.5], ['cafe', 0.35], ['lofi', 0.45]] },
    { name: 'Fireside', mix: [['fireplace', 0.6], ['wind-rec', 0.2], ['piano', 0.3]] },
    { name: 'Study hall', mix: [['typing', 0.35], ['cafe', 0.2], ['clock', 0.2]] },
    { name: 'Record night', mix: [['vinyl', 0.4], ['piano', 0.3], ['fireplace', 0.2]] },
    { name: 'Cat nap', mix: [['purr', 0.5], ['rain-heavy', 0.3], ['clock', 0.12]] },
    { name: 'Night', mix: [['night', 0.55], ['hum', 0.08]] },
    { name: 'Deep focus', mix: [['hum', 0.25], ['rain', 0.25], ['brown', 0.1]] },
    { name: 'Server room', mix: [['fan-rec', 0.5], ['hum', 0.15], ['drone', 0.1]] },
  ] },
  { group: 'On the move', scenes: [
    { name: 'Night train', mix: [['train', 0.55], ['rain-rec', 0.3]] },
    { name: 'Red-eye flight', mix: [['airplane', 0.5], ['hum', 0.08]] },
    { name: 'Harbour morning', mix: [['harbour', 0.5], ['ocean', 0.35], ['chimes', 0.1]] },
    { name: 'City balcony', mix: [['city-rec', 0.45], ['city-synth', 0.15], ['rain-heavy', 0.2]] },
    { name: 'Sunday market', mix: [['market', 0.45], ['chimes', 0.1], ['lofi', 0.25]] },
  ] },
  { group: 'Elsewhere', scenes: [
    { name: 'Deep sea', mix: [['underwater', 0.55], ['drone', 0.2], ['heartbeat', 0.15]] },
    { name: 'Space station', mix: [['space', 0.5], ['fan-synth', 0.2], ['clock', 0.1]] },
    { name: 'Synth only', mix: [['ocean-synth', 0.4], ['stream-synth', 0.3], ['birds', 0.2], ['crickets', 0.1]] },
  ] },
];
const DEFAULT_SCENE = 'Rainy café';
const SCENE_COUNT = SCENES.reduce((n, g) => n + g.scenes.length, 0);

function toLayer(c: Sound, base: string, volume = c.volume): LayerConfig {
  return c.synth ? { id: c.id, synth: c.synth, volume } : { id: c.id, src: `${base}/sounds/${c.file}`, volume };
}

function sceneLayers(base: string): Record<string, LayerConfig[]> {
  const out: Record<string, LayerConfig[]> = {};
  for (const g of SCENES) for (const s of g.scenes) out[s.name] = s.mix.map(([id, v]) => toLayer(NAMES[id], base, v));
  return out;
}

const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const count = (n: number) => (n <= 10 ? words[n] : String(n));

export default function Mixer({ base }: { base: string }) {
  const all = useMemo(() => sceneLayers(base), [base]);
  const [scene, setScene] = useState<string>(DEFAULT_SCENE);
  const [layers, setLayers] = useState<LayerConfig[]>(all[DEFAULT_SCENE]);
  const a = useAmbiently(layers, { fadeMs: 900 });

  const pick = (name: string) => { setScene(name); setLayers(all[name]); if (!a.playing) a.play(); };
  const inMix = (id: string) => layers.some((l) => l.id === id);
  const toggleSound = (c: Sound) => {
    setScene('Custom');
    setLayers((prev) => (prev.some((l) => l.id === c.id) ? prev.filter((l) => l.id !== c.id) : [...prev, toLayer(c, base)]));
    if (!a.playing) a.play();
  };
  const layerOn = (id: string) => a.layers.find((l) => l.id === id)?.playing ?? false;
  const volumeOf = (id: string) => a.layers.find((l) => l.id === id)?.volume ?? 0;
  const [copied, setCopied] = useState(false);

  const snippet = `import { AmbientlyEngine } from 'ambiently';\n\nconst ambient = new AmbientlyEngine([\n${layers
    .map((l) => `  { id: '${l.id}', ${l.synth ? `synth: '${l.synth}'` : `src: '${l.src!.replace(base, '')}'`}, volume: ${volumeOf(l.id).toFixed(2)} },`)
    .join('\n')}\n]);\n\nambient.play();`;

  const synthCount = CATALOG.filter((c) => c.kind === 'synth').length;

  return (
    <>
      <section className="hero">
        <div>
          <h1>Ambient sound for the web, <em>in five lines.</em></h1>
          <p>Layer loops and {count(synthCount)} synthesised ambiences, from rain and surf to a heartbeat and a ticking clock. Fade everything, crossfade scenes, and never think about autoplay again.</p>
          <div className="install">
            <code>npm install ambiently</code>
            <button onClick={() => { navigator.clipboard?.writeText('npm install ambiently'); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? 'copied' : 'copy'}</button>
          </div>
        </div>
        <div className="transport">
          <button className={`big ${a.playing ? 'off' : ''}`} onClick={() => a.toggle()}>
            {a.playing ? '■ Pause everything' : '▶ Play the scene'}
          </button>
          <div className="row">
            <label>Master</label>
            <input type="range" aria-label="Master volume" min={0} max={1} step={0.01} value={a.masterVolume} onChange={(e) => a.setMasterVolume(e.target.valueAsNumber)} />
          </div>
          <span className="hint">{a.unlocked ? 'Audio unlocked. Every change below is a gain ramp.' : 'Browsers need one click before audio can start.'}</span>
        </div>
      </section>

      <section className="scenes-wrap" aria-label="Scenes">
        <div className="scenes-head"><h2>{SCENE_COUNT} scenes</h2><p>Each one is a few layers with volumes. Pick one, then bend it with any sound below.</p></div>
        {SCENES.map((g) => (
          <div key={g.group} className="scene-group">
            <span className="scene-group-name">{g.group}</span>
            <div className="scenes">
              {g.scenes.map((s) => (
                <button key={s.name} className={`scene ${scene === s.name ? 'on' : ''}`} onClick={() => pick(s.name)} aria-pressed={scene === s.name}>{s.name}</button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <h2 className="sr-only">Mixer</h2>
      <section className="mixer">
        {layers.map((l) => (
          <div key={l.id} className={`layer ${layerOn(l.id) ? 'on' : ''}`}>
            <header>
              <div>
                <h3>{NAMES[l.id]?.name ?? l.id}</h3>
                <span className={`tag ${NAMES[l.id]?.kind ?? ''}`}>{NAMES[l.id] ? KIND_LABEL[NAMES[l.id].kind] : ''}</span>
              </div>
              <button className={`toggle ${layerOn(l.id) ? 'on' : ''}`} aria-label={`Toggle ${l.id}`} onClick={() => a.toggle(l.id)} />
            </header>
            <input type="range" aria-label={`${NAMES[l.id]?.name ?? l.id} volume`} min={0} max={1} step={0.01} value={volumeOf(l.id)} onChange={(e) => a.setVolume(l.id, e.target.valueAsNumber)} />
            <div className="meter"><i style={{ width: `${(layerOn(l.id) ? volumeOf(l.id) : 0) * 100}%` }} /></div>
          </div>
        ))}
      </section>

      <Visualizer engine={a.engine} active={a.playing} />

      <section className="catalog">
        <div className="catalog-head">
          <h2>All {CATALOG.length} sounds</h2>
          <p>Tap any of them to add it to the mix, tap again to take it out. The code below updates as you go.</p>
        </div>
        {(['recording', 'synth', 'music'] as Kind[]).map((kind) => (
          <div key={kind} className="catalog-group">
            <h3 className={`tag ${kind}`}>{KIND_LABEL[kind]} · {CATALOG.filter((c) => c.kind === kind).length}</h3>
            <div className="catalog-grid">
              {CATALOG.filter((c) => c.kind === kind).map((c) => (
                <button key={c.id} className={`sound ${inMix(c.id) ? 'on' : ''}`} onClick={() => toggleSound(c)} aria-pressed={inMix(c.id)}>
                  <span className="sound-dot" aria-hidden="true" />
                  <span className="sound-name">{c.name}</span>
                  <span className="sound-note">{c.note}</span>
                  <span className="sound-state">{inMix(c.id) ? 'In the mix' : 'Add'}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="code">
        <pre dangerouslySetInnerHTML={{ __html: snippet
          .replace(/'([^']*)'/g, "<span class='s'>'$1'</span>")
          .replace(/\b(import|from|const|new)\b/g, "<span class='k'>$1</span>") }} />
      </section>
    </>
  );
}
