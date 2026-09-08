'use client';
import { useMemo, useState } from 'react';
import { useAmbiently } from 'ambiently/react';
import type { LayerConfig } from 'ambiently';
import Visualizer from './Visualizer';

const NAMES: Record<string, { name: string; note: string }> = {
  rain: { name: 'Rain', note: 'synth · pink noise, high-pass, slow swell' },
  wind: { name: 'Wind', note: 'synth · brown noise, wandering band-pass' },
  fire: { name: 'Fire', note: 'synth · rumble plus gated crackles' },
  hum: { name: 'Hum', note: 'synth · 50 Hz with harmonics' },
  lofi: { name: 'Lo-fi beat', note: 'file · mp3, seamless loop' },
  piano: { name: 'Piano loop', note: 'file · mp3, seamless loop' },
};

function scenes(base: string): Record<string, LayerConfig[]> {
  const lofi = `${base}/sounds/lofi-relax-beat.mp3`;
  const piano = `${base}/sounds/piano-loop.mp3`;
  return {
    'Rainy café': [{ id: 'rain', synth: 'rain', volume: 0.45 }, { id: 'lofi', src: lofi, volume: 0.55 }],
    'Fireside': [{ id: 'fire', synth: 'fire', volume: 0.6 }, { id: 'wind', synth: 'wind', volume: 0.2 }, { id: 'piano', src: piano, volume: 0.35 }],
    'Deep focus': [{ id: 'hum', synth: 'hum', volume: 0.25 }, { id: 'rain', synth: 'rain', volume: 0.25 }],
    'Storm': [{ id: 'rain', synth: 'rain', volume: 0.8 }, { id: 'wind', synth: 'wind', volume: 0.7 }],
    'Everything': [
      { id: 'rain', synth: 'rain', volume: 0.35 }, { id: 'wind', synth: 'wind', volume: 0.2 }, { id: 'fire', synth: 'fire', volume: 0.3 },
      { id: 'hum', synth: 'hum', volume: 0.1 }, { id: 'lofi', src: lofi, volume: 0.5 }, { id: 'piano', src: piano, volume: 0.3 },
    ],
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
