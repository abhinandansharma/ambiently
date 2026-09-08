import Mixer from './components/Mixer';
import credits from '../public/sounds/CREDITS.json';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function Page() {
  return (
    <>
      <header className="wrap nav">
        <a className="brand" href={`${base}/`}><i />ambiently</a>
        <nav>
          <a className="link" href="https://github.com/abhinandansharma/ambiently" target="_blank" rel="noreferrer">GitHub</a>
          <a className="link" href="https://www.npmjs.com/package/ambiently" target="_blank" rel="noreferrer">npm</a>
        </nav>
      </header>
      <main className="wrap">
        <Mixer base={base} />
        <section className="features">
          <div><h4>Layers, not a tag</h4><p>Each sound has its own gain. Stack rain under a beat under a fireplace and mix live.</p></div>
          <div><h4>Nothing clicks</h4><p>Play, pause, volume and scene changes are gain ramps on the audio clock.</p></div>
          <div><h4>Synth ambiences</h4><p>Rain, wind, fire, hum and three colours of noise are generated in the browser. No files.</p></div>
          <div><h4>Autoplay handled</h4><p>The context wakes on the first gesture and starts whatever you asked for.</p></div>
          <div><h4>React ready</h4><p><code>useAmbiently()</code> keeps your layers in sync and re-renders on every change.</p></div>
          <div><h4>Tiny</h4><p>About 5 kB gzipped, zero dependencies, ESM and CJS, typed.</p></div>
        </section>
        <section className="credits">
          <h4>Sample recordings</h4>
          <p>All field recordings are CC0 (public domain) from Freesound via Openverse, cut to seamless loops. Thank you to the recordists:</p>
          <ul>
            {Object.entries(credits as Record<string, { title: string; creator?: string; source?: string }>).map(([k, c]) => (
              <li key={k}><a href={c.source} target="_blank" rel="noreferrer">{c.title}</a>{c.creator ? ` — ${c.creator}` : ''}</li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="wrap">
        <span>MIT · <a href="https://github.com/abhinandansharma" target="_blank" rel="noreferrer">Abhinandan Sharma</a></span>
        <span><a href="https://abhinandansharma.github.io/portfolio/" target="_blank" rel="noreferrer">More things I built</a></span>
      </footer>
      <a className="made-by" href="https://abhinandansharma.github.io/portfolio/" target="_blank" rel="noreferrer" aria-label="Made by Abhinandan Sharma. Opens the portfolio."><span className="made-by-dot"></span>Made by Abhinandan <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a>
    </>
  );
}
