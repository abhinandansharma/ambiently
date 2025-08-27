"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var index_exports = {};
__export(index_exports, {
  Ambiently: () => Ambiently
});
module.exports = __toCommonJS(index_exports);
var import_react2 = require("react");

// src/useAudioPlayer.ts
var import_react = require("react");
function useAudioPlayer({
  src,
  loop = true,
  defaultVolume = 0.5,
  fadeDuration = 1e3
}) {
  const audioRef = (0, import_react.useRef)(null);
  const [isPlaying, setIsPlaying] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Ambiently
});
