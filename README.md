🎶 Ambiently

A lightweight ambient sound engine for Next.js apps.
Play looping background sounds (lo-fi, rain, fireplace, etc.) with fade-in/out and volume control.

Built with Next.js, ships with an embeddable Ambiently Engine core, and a demo app.

✨ Features

🎵 Multiple background audio layers (rain, lofi, fireplace, etc.)

🔄 Seamless looping & volume control

🌗 Fade-in / fade-out playback support

⚡ Simple API via AmbientlyEngine

🛠️ Next.js 13+ App Router ready

📦 Lightweight, no external deps

📁 Project Structure
.
├── ambiently-core/        # Core audio engine (library)
│   ├── index.ts           # Exports Ambiently + AmbientlyEngine
│   └── useAudioPlayer.ts
│
├── demo/                  # Example Next.js app using Ambiently
│   └── app/
│       └── ambiently.tsx  # Demo AmbientlyPlayer
│
├── public/sounds/         # Sample sound files
└── README.md

🚀 Getting Started

Run the development server:

npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev


Then open http://localhost:3000
 to see it in action.

🛠️ Usage

Example usage of AmbientlyEngine inside your Next.js component:

"use client";
import { AmbientlyEngine } from "ambiently-core";

const engine = new AmbientlyEngine([
  { src: "/sounds/rain.mp3", volume: 0.5 },
  { src: "/sounds/lofi.mp3", volume: 0.7 }
]);

export default function Player() {
  return (
    <button onClick={() => engine.toggle()}>
      Toggle Ambient Sounds
    </button>
  );
}

📦 Deploy on Vercel

The easiest way to deploy your Next.js app is on Vercel
.

Check out the official Next.js deployment docs
 for more details.