'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAmbiently } from 'ambiently/react';
import type { LayerConfig } from 'ambiently';
import Visualizer from './Visualizer';
import { BY_ID, CATALOG, CATEGORIES, KIND_LABEL, SCENES, SCENE_BY_NAME, SCENE_COUNT, decodeMix, encodeMix, sceneToLayers, toLayer, type Category, type Sound } from './catalog';

const DEFAULT_SCENE = 'Rainy café';
const STORE = 'ambiently.mix';

/** What the page opened with: a mix from the URL hash, then the last one saved in this browser, then the default scene. */
function initial(base: string): { scene: string; layers: LayerConfig[] } {
  const fallback = { scene: DEFAULT_SCENE, layers: sceneToLayers(SCENE_BY_NAME[DEFAULT_SCENE], base) };
  if (typeof window === 'undefined') return fallback;
  try {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const scene = hash.get('scene');
    if (scene && SCENE_BY_NAME[scene]) return { scene, layers: sceneToLayers(SCENE_BY_NAME[scene], base) };
    const mix = hash.get('mix');
    if (mix) { const layers = decodeMix(mix, base); if (layers.length) return { scene: 'Custom', layers }; }
    const saved = localStorage.getItem(STORE);
    if (saved) { const s = JSON.parse(saved) as { scene: string; mix: string }; const layers = decodeMix(s.mix, base); if (layers.length) return { scene: s.scene, layers }; }
  } catch { /* ignore a bad hash or storage */ }
  return fallback;
}

export default function Mixer({ base }: { base: string }) {
  const [scene, setScene] = useState<string>(DEFAULT_SCENE);
  const [layers, setLayers] = useState<LayerConfig[]>(() => sceneToLayers(SCENE_BY_NAME[DEFAULT_SCENE], base));
  const a = useAmbiently(layers, { fadeMs: 900 });
  const hydrated = useRef(false);

  // Restore after mount so the server and first client render agree.
  useEffect(() => {
    const init = initial(base);
    setScene(init.scene); setLayers(init.layers);
    hydrated.current = true;
  }, [base]);

  // The live volumes and reverb come from the engine; keep the URL and storage in step with them.
  const liveLayers = useMemo(() => layers.map((l) => {
    const s = a.layers.find((x) => x.id === l.id);
    return s ? { ...l, volume: s.volume, reverb: s.reverb || undefined } : l;
  }), [layers, a.layers]);
  useEffect(() => {
    if (!hydrated.current || typeof window === 'undefined') return;
    const mix = encodeMix(liveLayers);
    const hash = scene !== 'Custom' && SCENE_BY_NAME[scene] ? `scene=${encodeURIComponent(scene)}` : `mix=${mix}`;
    history.replaceState(null, '', `#${hash}`);
    try { localStorage.setItem(STORE, JSON.stringify({ scene, mix })); } catch { /* storage off */ }
  }, [liveLayers, scene]);

  // Play after the new layers have reached the engine (the hook syncs them in an effect that runs before this one).
  const wantPlay = useRef(false);
  useEffect(() => { if (wantPlay.current) { wantPlay.current = false; a.play(); } }, [layers, a]);
  const pick = (name: string) => { setScene(name); setLayers(sceneToLayers(SCENE_BY_NAME[name], base)); wantPlay.current = true; };
  const inMix = (id: string) => layers.some((l) => l.id === id);
  const toggleSound = (c: Sound) => {
    setScene('Custom');
    const removing = layers.some((l) => l.id === c.id);
    setLayers((prev) => (prev.some((l) => l.id === c.id) ? prev.filter((l) => l.id !== c.id) : [...prev, toLayer(c, base)]));
    if (!removing) wantPlay.current = true;
  };
  const layerOn = (id: string) => a.layers.find((l) => l.id === id)?.playing ?? false;
  const volumeOf = (id: string) => a.layers.find((l) => l.id === id)?.volume ?? layers.find((l) => l.id === id)?.volume ?? 0.5;
  const reverbOf = (id: string) => a.layers.find((l) => l.id === id)?.reverb ?? layers.find((l) => l.id === id)?.reverb ?? 0;

  // Space plays and pauses when the focus is not in a control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.code !== 'Space' || !t || ['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'A'].includes(t.tagName) || t.isContentEditable) return;
      e.preventDefault(); a.toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [a]);
  const [copied, setCopied] = useState<'install' | 'link' | null>(null);
  const flash = (what: 'install' | 'link') => { setCopied(what); setTimeout(() => setCopied(null), 1200); };
  const share = () => { navigator.clipboard?.writeText(window.location.href); flash('link'); };

  // catalogue browsing
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Category | 'All'>('All');
  const q = query.trim().toLowerCase();
  const shown = CATALOG.filter((c) => (cat === 'All' || c.cat === cat) && (!q || c.name.toLowerCase().includes(q) || c.note.toLowerCase().includes(q) || c.kind.includes(q)));

  const snippet = `import { AmbientlyEngine } from 'ambiently';\n\nconst ambient = new AmbientlyEngine([\n${liveLayers
    .map((l) => `  { id: '${l.id}', ${l.synth ? `synth: '${l.synth}'` : `src: '${l.src!.replace(base, '')}'`}, volume: ${(l.volume ?? 0.5).toFixed(2)}${l.reverb ? `, reverb: ${l.reverb.toFixed(2)}` : ''} },`)
    .join('\n')}\n]);\n\nambient.play();`;

  const counts = { synth: CATALOG.filter((c) => c.kind === 'synth').length, music: CATALOG.filter((c) => c.kind === 'music').length, recording: CATALOG.filter((c) => c.kind === 'recording').length };

  return (
    <>
      <section className="hero">
        <div>
          <h1>Ambient sound for the web, <em>in five lines.</em></h1>
          <p>Layer {counts.recording} field recordings, {counts.music} music loops and {counts.synth} synthesised ambiences, from rain and surf to a lo-fi beat and a ticking clock. Fade everything, send any layer to a shared reverb, crossfade scenes, and never think about autoplay again.</p>
          <div className="install">
            <code>npm install ambiently</code>
            <button onClick={() => { navigator.clipboard?.writeText('npm install ambiently'); flash('install'); }}>{copied === 'install' ? 'copied' : 'copy'}</button>
          </div>
        </div>
      </section>

      {/* the dock sticks to the top so the mix can be driven from anywhere on the page */}
      <section className="dock" aria-label="Player">
        <button className={`big ${a.playing ? 'off' : ''}`} onClick={() => a.toggle()}>{a.playing ? '■ Pause' : '▶ Play'}</button>
        <div className="dock-now">
          <strong>{scene}</strong>
          <span><b className="num">{layers.length}</b> {layers.length === 1 ? 'layer' : 'layers'}{a.unlocked ? '' : ' · tap play to unlock audio'}</span>
        </div>
        <label className="dock-master"><span>Master</span><input type="range" aria-label="Master volume" min={0} max={1} step={0.01} value={a.masterVolume} onChange={(e) => a.setMasterVolume(e.target.valueAsNumber)} /><b className="num">{Math.round(a.masterVolume * 100)}</b></label>
        <button className="ghost" onClick={share} title="Copy a link to this mix">{copied === 'link' ? 'Link copied' : 'Share mix'}</button>
      </section>

      <h2 className="sr-only">Mixer</h2>
      <section className="mixer">
        {layers.map((l) => (
          <div key={l.id} className={`layer ${layerOn(l.id) ? 'on' : ''}`}>
            <header>
              <div>
                <h3>{BY_ID[l.id]?.name ?? l.id}</h3>
                <span className={`kind ${BY_ID[l.id]?.kind ?? ''}`}>{BY_ID[l.id] ? KIND_LABEL[BY_ID[l.id].kind] : ''}</span>
              </div>
              <div className="layer-actions">
                <button className={`toggle ${layerOn(l.id) ? 'on' : ''}`} aria-label={`Toggle ${l.id}`} onClick={() => a.toggle(l.id)} />
                <button className="remove" aria-label={`Remove ${BY_ID[l.id]?.name ?? l.id}`} title="Remove from the mix" onClick={() => { setScene('Custom'); setLayers((p) => p.filter((x) => x.id !== l.id)); }}><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></button>
              </div>
            </header>
            <label className="slider"><span>Volume</span><input type="range" aria-label={`${BY_ID[l.id]?.name ?? l.id} volume`} min={0} max={1} step={0.01} value={volumeOf(l.id)} onChange={(e) => a.setVolume(l.id, e.target.valueAsNumber)} /><b className="num">{Math.round(volumeOf(l.id) * 100)}</b></label>
            <label className="slider"><span>Room</span><input type="range" aria-label={`${BY_ID[l.id]?.name ?? l.id} reverb`} min={0} max={1} step={0.01} value={reverbOf(l.id)} onChange={(e) => a.setReverb(l.id, e.target.valueAsNumber)} /><b className="num">{Math.round(reverbOf(l.id) * 100)}</b></label>
            <div className="meter"><i style={{ width: `${(layerOn(l.id) ? volumeOf(l.id) : 0) * 100}%` }} /></div>
          </div>
        ))}
        {layers.length === 0 && <p className="empty">Nothing in the mix. Pick a scene or add a sound below.</p>}
      </section>

      <Visualizer engine={a.engine} active={a.playing} />

      <section className="scenes-wrap" aria-label="Scenes">
        <div className="section-head"><h2><b className="num">{SCENE_COUNT}</b> scenes</h2><p>Each one is a few layers with volumes. Pick one, then bend it with any sound below.</p></div>
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

      <section className="catalog">
        <div className="section-head">
          <h2>All <b className="num">{CATALOG.length}</b> sounds</h2>
          <p>Tap one to add it to the mix, tap again to take it out. The code at the bottom updates as you go.</p>
        </div>
        <div className="catalog-tools">
          <input type="search" className="search" placeholder="Search sounds" aria-label="Search sounds" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="cats" role="tablist" aria-label="Categories">
            {(['All', ...CATEGORIES] as const).map((c) => (
              <button key={c} role="tab" aria-selected={cat === c} className={`cat ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="catalog-grid">
          {shown.map((c) => (
            <button key={c.id} className={`sound ${inMix(c.id) ? 'on' : ''}`} onClick={() => toggleSound(c)} aria-pressed={inMix(c.id)}>
              <span className="sound-dot" aria-hidden="true" />
              <span className="sound-name">{c.name}</span>
              <span className="sound-note">{c.note}</span>
              <span className={`sound-kind ${c.kind}`}>{c.kind === 'recording' ? 'Recording' : c.kind === 'music' ? 'Music' : 'Synth'}</span>
            </button>
          ))}
          {shown.length === 0 && <p className="empty">No sound matches that. Try another word.</p>}
        </div>
      </section>

      <section className="code">
        <pre dangerouslySetInnerHTML={{ __html: snippet
          .replace(/'([^']*)'/g, "<span class='s'>'$1'</span>")
          .replace(/\b(import|from|const|new)\b/g, "<span class='k'>$1</span>") }} />
      </section>
    </>
  );
}
