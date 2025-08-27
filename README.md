# 🎶 Ambiently

A lightweight ambient sound engine for **Next.js apps**.  
Play looping background sounds (lo-fi, rain, fireplace, etc.) with fade-in/out and volume control.  

Built with Next.js, ships with an **embeddable Ambiently Engine core** + a demo app.

---

## ✨ Features

- 🎵 Multiple background audio layers (rain, lofi, fireplace, etc.)
- 🔄 Seamless looping & volume control
- 🌗 Fade-in / fade-out playback
- ⚡ Simple API via `AmbientlyEngine`
- 🛠️ Next.js 13+ App Router ready
- 📦 Lightweight, no external deps

---

## 📁 Project Structure
```plaintext
.
├── ambiently-core/ # Core audio engine (library)
│ ├── index.ts # Exports Ambiently + AmbientlyEngine
│ └── useAudioPlayer.ts
│
├── demo/ # Example Next.js app using Ambiently
│ └── app/
│ └── ambiently.tsx # Demo AmbientlyPlayer
│
├── public/sounds/ # Sample sound files
└── README.md
```

---

## 🚀 Getting Started

#### Clone and run the demo locally:

```bash
npm install
npm run dev
Then open http://localhost:3000 🚀
```
## 🛠️ Usage
Install the core library:
npm install ambiently-core

### Example usage inside your Next.js component:
```bash "use client";
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
```
## 📦 Deployment

The easiest way to deploy the demo is on Vercel
.
Check out the Next.js deployment docs
 for more details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open an issue
 or submit a PR.

## 📜 License

MIT © Abhinandan Sharma

