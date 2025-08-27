"use client";

import { useEffect } from "react";
import { useAudioPlayer } from "./useAudioPlayer";

interface AmbientlyProps {
  src?: string;
}

export const Ambiently = ({ src = "/sounds/lofi.mp3" }: AmbientlyProps) => {
  const { play, pause, isPlaying } = useAudioPlayer({
    src,
    defaultVolume: 0.4,
    fadeDuration: 1500,
  });

  useEffect(() => {
    const start = () => {
      if (!isPlaying) play();
      window.removeEventListener("click", start);
      window.removeEventListener("scroll", start);
    };
    window.addEventListener("click", start);
    window.addEventListener("scroll", start);
    return () => {
      window.removeEventListener("click", start);
      window.removeEventListener("scroll", start);
    };
  }, [isPlaying, play]);

  return null;
};

// --- Engine version (new) ---
export class AmbientlyEngine {
  private audios: HTMLAudioElement[];

  constructor(sounds: { src: string; volume?: number; loop?: boolean }[]) {
    this.audios = sounds.map(({ src, volume = 0.5, loop = true }) => {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.loop = loop;
      return audio;
    });
  }

  playAll() {
    this.audios.forEach(a =>
      a.play().catch(err => console.warn("Autoplay blocked:", err))
    );
  }

  stopAll() {
    this.audios.forEach(a => a.pause());
  }
}
