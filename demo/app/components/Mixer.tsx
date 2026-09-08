'use client';
import { useMemo, useState } from 'react';
import { useAmbiently } from 'ambiently/react';
import type { LayerConfig } from 'ambiently';
import Visualizer from './Visualizer';

const NAMES: Record<string, { name: string; note: string }> = {
  rain: { name: 'Rain (synth)', note: 'synth · pink noise, high-pass, slow swell' },
  wind: { name: 'Wind (synth)', note: 'synth · brown noise, wandering band-pass' },
  fire: { name: 'Fire (synth)', note: 'synth · rumble plus gated crackles' },
  hum: { name: 'Hum', note: 'synth · 50 Hz with harmonics' },
  'rain-rec': { name: 'Soft rain', note: 'recording · CC0, seamless loop' },
  fireplace: { name: 'Fireplace', note: 'recording · CC0, seamless loop' },
  ocean: { name: 'Ocean waves', note: 'recording · CC0, seamless loop' },
  forest: { name: 'Forest birds', note: 'recording · CC0, seamless loop' },
  cafe: { name: 'Café chatter', note: 'recording · CC0, seamless loop' },
  thunder: { name: 'Thunder', note: 'recording · CC0, seamless loop' },
  'wind-rec': { name: 'Wind at the window', note: 'recording · CC0, seamless loop' },
  night: { name: 'Crickets at night', note: 'recording · CC0, seamless loop' },
  lofi: { name: 'Lo-fi beat', note: 'music · mp3 loop' },
  piano: { name: 'Piano loop', note: 'music · mp3 loop' },
};

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
            <input type="range" min={0} max={1} step={0.01} value={a.masterVolume} onChange={(e) => a.setMasterVolume(e.target.valueAsNumber)} />
          </div>
          <span className="hint">{a.unlocked ? 'Audio unlocked. Every change below is a gain ramp.' : 'Browsers need one click before audio can start.'}</span>
        </div>
      </section>

      <div className="scenes">
        {Object.keys(all).map((name) => (
          <button key={name} className={`scene ${scene === name ? 'on' : ''}`} onClick={() => pick(name)}>{name}</button>
        ))}
      </div>

      <section className="mixer">
        {layers.map((l) => (
          <div key={l.id} className={`layer ${layerOn(l.id) ? 'on' : ''}`}>
            <header>
              <div>
                <h3>{NAMES[l.id]?.name ?? l.id}</h3>
                <span className="tag">{NAMES[l.id]?.note}</span>
              </div>
              <button className={`toggle ${layerOn(l.id) ? 'on' : ''}`} aria-label={`Toggle ${l.id}`} onClick={() => a.toggle(l.id)} />
            </header>
            <input type="range" min={0} max={1} step={0.01} value={volumeOf(l.id)} onChange={(e) => a.setVolume(l.id, e.target.valueAsNumber)} />
            <div className="meter"><i style={{ width: `${(layerOn(l.id) ? volumeOf(l.id) : 0) * 100}%` }} /></div>
          </div>
        ))}
      </section>

      <Visualizer engine={a.engine} active={a.playing} />

      <section className="code">
        <pre dangerouslySetInnerHTML={{ __html: snippet
          .replace(/'([^']*)'/g, "<span class='s'>'$1'</span>")
          .replace(/\b(import|from|const|new)\b/g, "<span class='k'>$1</span>") }} />
      </section>
    </>
  );
}
