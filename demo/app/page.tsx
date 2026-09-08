import Mixer from './components/Mixer';

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
      </main>
      <footer className="wrap">
        <span>MIT · <a href="https://github.com/abhinandansharma" target="_blank" rel="noreferrer">Abhinandan Sharma</a></span>
        <span><a href="https://abhinandansharma.github.io/portfolio/" target="_blank" rel="noreferrer">More things I built</a></span>
      </footer>
    </>
  );
}
