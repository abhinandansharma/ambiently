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
      <a className="made-by" href="https://abhinandansharma.github.io/portfolio/" target="_blank" rel="noreferrer" aria-label="Made by Abhinandan Sharma. Opens the portfolio."><svg className="made-by-mark" viewBox="0 0 512 512" width="20" height="20" aria-hidden="true"><defs><clipPath id="mb-clip"><rect width="512" height="512" rx="112"/></clipPath></defs><rect width="512" height="512" rx="112" fill="#e0202a"/><g clipPath="url(#mb-clip)"><path d="M256 78 C156 78 100 154 100 254 L100 540 L412 540 L412 254 C412 154 356 78 256 78 Z" fill="#0b0b0b"/><path d="M404 206 Q470 178 518 132 Q492 224 410 252 Z" fill="#0b0b0b"/><path d="M406 232 Q468 240 512 292 Q462 262 408 250 Z" fill="#0b0b0b"/><path d="M118 232 Q256 196 394 232 L394 262 Q256 304 118 262 Z" fill="#f1ede4"/><path d="M152 248 L238 234 L242 270 L166 280 Z" fill="#0b0b0b"/><path d="M360 248 L274 234 L270 270 L346 280 Z" fill="#0b0b0b"/></g></svg><span>Made by <b>Abhinandan</b></span></a>
    </>
  );
}
