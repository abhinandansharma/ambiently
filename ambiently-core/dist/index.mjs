// src/index.tsx
import { useEffect as useEffect2 } from "react";

// src/useAudioPlayer.ts
import { useEffect, useRef, useState } from "react";
function useAudioPlayer({
  src,
  loop = true,
  defaultVolume = 0.5,
  fadeDuration = 1e3
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = 0;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src, loop]);
  const fadeVolume = (target) => {
    const audio = audioRef.current;
    if (!audio) return;
    const steps = 20;
    const stepTime = fadeDuration / steps;
    const diff = target - audio.volume;
    let currentStep = 0;
    const fade = setInterval(() => {
      if (!audio) return;
      currentStep++;
      audio.volume = audio.volume + diff / steps;
      if (currentStep >= steps) {
        clearInterval(fade);
        audio.volume = target;
      }
    }, stepTime);
  };
  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => {
      setIsPlaying(true);
      fadeVolume(defaultVolume);
    });
  };
  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    fadeVolume(0);
    setTimeout(() => audio.pause(), fadeDuration);
    setIsPlaying(false);
  };
  return { play, pause, isPlaying };
}

// src/index.tsx
var Ambiently = ({ src = "/sounds/lofi.mp3" }) => {
  const { play, pause, isPlaying } = useAudioPlayer({
    src,
    defaultVolume: 0.4,
    fadeDuration: 1500
  });
  useEffect2(() => {
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
export {
  Ambiently
};
