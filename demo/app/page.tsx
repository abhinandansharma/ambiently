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
          <div><h3>Layers, not a tag</h3><p>Each sound has its own gain. Stack rain under a beat under a fireplace and mix live.</p></div>
          <div><h3>Nothing clicks</h3><p>Play, pause, volume and scene changes are gain ramps on the audio clock.</p></div>
          <div><h3>Synth ambiences</h3><p>Twenty-five are generated in the browser: rain, surf, a stream, thunder, crickets, birds, a clock, vinyl, a heartbeat, even a lo-fi beat and a music box. No files.</p></div>
          <div><h3>One shared room</h3><p>Every layer has a reverb send into a synthetic hall. Set it per layer, or leave it dry.</p></div>
          <div><h3>Autoplay handled</h3><p>The context wakes on the first gesture and starts whatever you asked for.</p></div>
          <div><h3>React ready</h3><p><code>useAmbiently()</code> keeps your layers in sync and re-renders on every change.</p></div>
          <div><h3>Tiny</h3><p>About 9 kB gzipped, zero dependencies, ESM and CJS, typed.</p></div>
        </section>
        <section className="credits">
          <details>
            <summary>
              <span className="credits-title">Credits</span>
              <span className="credits-sub">{Object.keys(credits).length} recordings and music loops, all CC0 from Freesound via Openverse. The library itself ships no audio.</span>
            </summary>
            <ul className="credits-grid">
              {Object.entries(credits as Record<string, { title: string; creator?: string; source?: string }>).map(([k, c]) => (
                <li key={k}><a href={c.source} target="_blank" rel="noreferrer">{c.title.replace(/\.(wav|mp3|aif|flac|ogg)$/i, '')}</a>{c.creator ? <span>{c.creator.replace(/^deleted_user_\d+$/, 'a deleted Freesound user')}</span> : null}</li>
              ))}
            </ul>
          </details>
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
