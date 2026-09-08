'use client';
import { useMemo, useState } from 'react';
import { useAmbiently } from 'ambiently/react';
import type { LayerConfig } from 'ambiently';
import Visualizer from './Visualizer';

type Kind = 'recording' | 'synth' | 'music';
type Sound = { id: string; name: string; note: string; kind: Kind; file?: string; synth?: 'rain' | 'wind' | 'fire' | 'hum'; volume: number };

/** Every sound the demo ships. Recordings are CC0 field recordings cut to seamless loops; synths are generated in the browser. */
const CATALOG: Sound[] = [
  { id: 'rain-rec', name: 'Soft rain', note: 'Steady rain on leaves', kind: 'recording', file: 'rain.m4a', volume: 0.5 },
  { id: 'thunder', name: 'Thunder', note: 'Distant rolling storm', kind: 'recording', file: 'thunder.m4a', volume: 0.6 },
  { id: 'wind-rec', name: 'Wind at the window', note: 'Howling through a crack', kind: 'recording', file: 'wind.m4a', volume: 0.3 },
  { id: 'ocean', name: 'Ocean waves', note: 'Waves of Hawaii', kind: 'recording', file: 'ocean.m4a', volume: 0.6 },
  { id: 'forest', name: 'Forest birds', note: 'Czech woods, early morning', kind: 'recording', file: 'forest.m4a', volume: 0.5 },
  { id: 'night', name: 'Crickets at night', note: 'Summer night outside', kind: 'recording', file: 'night.m4a', volume: 0.5 },
  { id: 'fireplace', name: 'Fireplace', note: 'Fire in a stove', kind: 'recording', file: 'fireplace.m4a', volume: 0.6 },
  { id: 'cafe', name: 'Café chatter', note: 'Bustling café room tone', kind: 'recording', file: 'cafe.m4a', volume: 0.35 },
  { id: 'lofi', name: 'Lo-fi beat', note: 'Relaxed hip-hop loop', kind: 'music', file: 'lofi-relax-beat.mp3', volume: 0.45 },
  { id: 'piano', name: 'Piano loop', note: 'Soft piano phrase', kind: 'music', file: 'piano-loop.mp3', volume: 0.3 },
  { id: 'rain', name: 'Rain (synth)', note: 'Pink noise, high-pass, slow swell', kind: 'synth', synth: 'rain', volume: 0.3 },
  { id: 'wind', name: 'Wind (synth)', note: 'Brown noise, wandering band-pass', kind: 'synth', synth: 'wind', volume: 0.25 },
  { id: 'fire', name: 'Fire (synth)', note: 'Rumble plus gated crackles', kind: 'synth', synth: 'fire', volume: 0.35 },
  { id: 'hum', name: 'Hum (synth)', note: '50 Hz with harmonics', kind: 'synth', synth: 'hum', volume: 0.1 },
];
const NAMES: Record<string, Sound> = Object.fromEntries(CATALOG.map((c) => [c.id, c]));
const KIND_LABEL: Record<Kind, string> = { recording: 'Recording · CC0', synth: 'Synth · no file', music: 'Music · CC0' };

function toLayer(c: Sound, base: string, volume = c.volume): LayerConfig {
  return c.synth ? { id: c.id, synth: c.synth, volume } : { id: c.id, src: `${base}/sounds/${c.file}`, volume };
}

function scenes(base: string): Record<string, LayerConfig[]> {
  const s = (f: string) => `${base}/sounds/${f}`;
  return {
    'Rainy café': [{ id: 'rain-rec', src: s('rain.m4a'), volume: 0.5 }, { id: 'cafe', src: s('cafe.m4a'), volume: 0.35 }, { id: 'lofi', src: s('lofi-relax-beat.mp3'), volume: 0.45 }],
    'Fireside': [{ id: 'fireplace', src: s('fireplace.m4a'), volume: 0.6 }, { id: 'wind-rec', src: s('wind.m4a'), volume: 0.2 }, { id: 'piano', src: s('piano-loop.mp3'), volume: 0.3 }],
    'Storm': [{ id: 'thunder', src: s('thunder.m4a'), volume: 0.7 }, { id: 'rain-rec', src: s('rain.m4a'), volume: 0.6 }, { id: 'wind', synth: 'wind', volume: 0.35 }],
    'Beach': [{ id: 'ocean', src: s('ocean.m4a'), volume: 0.7 }, { id: 'wind-rec', src: s('wind.m4a'), volume: 0.15 }],
    'Forest morning': [{ id: 'forest', src: s('forest.m4a'), volume: 0.6 }, { id: 'rain', synth: 'rain', volume: 0.12 }],
    'Night': [{ id: 'night', src: s('night.m4a'), volume: 0.55 }, { id: 'hum', synth: 'hum', volume: 0.08 }],
    'Deep focus': [{ id: 'hum', synth: 'hum', volume: 0.25 }, { id: 'rain', synth: 'rain', volume: 0.25 }],
    'Synth only': [{ id: 'rain', synth: 'rain', volume: 0.4 }, { id: 'wind', synth: 'wind', volume: 0.25 }, { id: 'fire', synth: 'fire', volume: 0.35 }, { id: 'hum', synth: 'hum', volume: 0.1 }],
  };
}

export default function Mixer({ base }: { base: string }) {
  const all = useMemo(() => scenes(base), [base]);
  const [scene, setScene] = useState<string>('Rainy café');
  const [layers, setLayers] = useState<LayerConfig[]>(all['Rainy café']);
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

  return (
    <>
      <section className="hero">
        <div>
          <h1>Ambient sound for the web, <em>in five lines.</em></h1>
          <p>Layer loops and synthesised rain, wind and fire. Fade everything, crossfade scenes, and never think about autoplay again.</p>
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

      <div className="scenes">
        {Object.keys(all).map((name) => (
          <button key={name} className={`scene ${scene === name ? 'on' : ''}`} onClick={() => pick(name)}>{name}</button>
        ))}
      </div>

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
          <h2>All sounds</h2>
          <p>Fourteen layers ship with the demo. Tap any of them to add it to the mix, tap again to take it out.</p>
        </div>
        {(['recording', 'music', 'synth'] as Kind[]).map((kind) => (
          <div key={kind} className="catalog-group">
            <h3 className={`tag ${kind}`}>{KIND_LABEL[kind]}</h3>
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
