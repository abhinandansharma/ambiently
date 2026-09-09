'use client';
import { useEffect, useRef } from 'react';
import type { AmbientlyEngine } from 'ambiently';

/** Frequency bars from the engine's master bus. Runs only while playing. */
export default function Visualizer({ engine, active }: { engine: AmbientlyEngine | null; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Resting state: the same 48 bars at their floor, so the meter reads as waiting rather than as an empty box.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || active) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const bars = 48, gap = 3, bw = (w - gap * (bars - 1)) / bars;
    for (let i = 0; i < bars; i++) {
      ctx.fillStyle = i % 6 === 0 ? '#f1ede4' : '#e0202a';
      ctx.globalAlpha = 0.22;
      ctx.fillRect(i * (bw + gap), h - 8, bw, 2);
    }
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !engine || !active) return;
    const analyser = engine.getAnalyser(128);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      analyser.getByteFrequencyData(data);
      const bars = 48, gap = 3, bw = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * data.length * 0.6)] / 255;
        const bh = Math.max(2, v * (h - 12));
        ctx.fillStyle = i % 6 === 0 ? '#f1ede4' : '#e0202a';
        ctx.globalAlpha = 0.35 + v * 0.65;
        ctx.fillRect(i * (bw + gap), h - bh - 6, bw, bh);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [engine, active]);
  return <div className="viz"><canvas ref={ref} /></div>;
}
