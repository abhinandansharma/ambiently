import type { LayerConfig, SynthPreset } from 'ambiently';

export type Kind = 'recording' | 'synth' | 'music';
export type Category = 'Weather' | 'Water' | 'Wildlife' | 'Places' | 'Travel' | 'Music' | 'Tones';
export type Sound = { id: string; name: string; note: string; kind: Kind; cat: Category; file?: string; synth?: SynthPreset; volume: number; reverb?: number };

export const CATEGORIES: Category[] = ['Weather', 'Water', 'Wildlife', 'Places', 'Travel', 'Music', 'Tones'];
export const KIND_LABEL: Record<Kind, string> = { recording: 'Recording · CC0', synth: 'Synth · no file', music: 'Music · CC0' };

/** Every sound the demo ships. Recordings and music are CC0 loops; synths are generated in the browser. */
export const CATALOG: Sound[] = [
  // weather
  { id: 'rain-rec', name: 'Soft rain', note: 'Steady rain on leaves', kind: 'recording', cat: 'Weather', file: 'rain.m4a', volume: 0.5 },
  { id: 'rain-heavy', name: 'Heavy rain', note: 'A downpour, close', kind: 'recording', cat: 'Weather', file: 'rain-heavy.m4a', volume: 0.5 },
  { id: 'thunder', name: 'Thunder', note: 'Distant rolling storm', kind: 'recording', cat: 'Weather', file: 'thunder.m4a', volume: 0.6 },
  { id: 'wind-rec', name: 'Wind at the window', note: 'Howling through a crack', kind: 'recording', cat: 'Weather', file: 'wind.m4a', volume: 0.3 },
  { id: 'rain', name: 'Rain', note: 'Pink noise, high-pass, slow swell', kind: 'synth', cat: 'Weather', synth: 'rain', volume: 0.3 },
  { id: 'wind', name: 'Wind', note: 'Brown noise, wandering band-pass', kind: 'synth', cat: 'Weather', synth: 'wind', volume: 0.25 },
  { id: 'thunder-synth', name: 'Thunder', note: 'A far rumble with rolls now and then', kind: 'synth', cat: 'Weather', synth: 'thunder', volume: 0.4 },
  { id: 'snow', name: 'Blizzard', note: 'Harder gusts and a whistle', kind: 'synth', cat: 'Weather', synth: 'snow', volume: 0.3 },
  // water
  { id: 'ocean', name: 'Ocean waves', note: 'Waves of Hawaii', kind: 'recording', cat: 'Water', file: 'ocean.m4a', volume: 0.6 },
  { id: 'harbour', name: 'Harbour gulls', note: 'Gulls and water at the quay', kind: 'recording', cat: 'Water', file: 'harbour.m4a', volume: 0.45 },
  { id: 'underwater', name: 'Deep sea', note: 'Below the surface', kind: 'recording', cat: 'Water', file: 'underwater.m4a', volume: 0.45 },
  { id: 'stream-rec', name: 'Mountain stream', note: 'Water up close over stones', kind: 'recording', cat: 'Water', file: 'stream.m4a', volume: 0.5 },
  { id: 'waterfall', name: 'Waterfall', note: 'A steady fall in the hills', kind: 'recording', cat: 'Water', file: 'waterfall.m4a', volume: 0.5 },
  { id: 'ocean-synth', name: 'Ocean', note: 'Swells that breathe, foam on top', kind: 'synth', cat: 'Water', synth: 'ocean', volume: 0.35 },
  { id: 'stream-synth', name: 'Stream', note: 'Fluttering band-pass babble', kind: 'synth', cat: 'Water', synth: 'stream', volume: 0.3 },
  // wildlife
  { id: 'forest', name: 'Forest birds', note: 'Czech woods, early morning', kind: 'recording', cat: 'Wildlife', file: 'forest.m4a', volume: 0.5 },
  { id: 'jungle', name: 'Rainforest', note: 'Bako National Park, Borneo', kind: 'recording', cat: 'Wildlife', file: 'jungle.m4a', volume: 0.5 },
  { id: 'meadow', name: 'Summer meadow', note: 'Insects and birds in tall grass', kind: 'recording', cat: 'Wildlife', file: 'meadow.m4a', volume: 0.5 },
  { id: 'night', name: 'Crickets at night', note: 'Summer night outside', kind: 'recording', cat: 'Wildlife', file: 'night.m4a', volume: 0.5 },
  { id: 'frogs-rec', name: 'Frogs', note: 'A pond after dark', kind: 'recording', cat: 'Wildlife', file: 'frogs.m4a', volume: 0.45 },
  { id: 'purr', name: 'Cat purring', note: 'A contented cat', kind: 'recording', cat: 'Wildlife', file: 'purr.m4a', volume: 0.4 },
  { id: 'crickets', name: 'Crickets', note: 'Two crickets pulsing at 40 Hz', kind: 'synth', cat: 'Wildlife', synth: 'crickets', volume: 0.3 },
  { id: 'birds', name: 'Birds', note: 'Sine-sweep phrases, near and far', kind: 'synth', cat: 'Wildlife', synth: 'birds', volume: 0.3 },
  { id: 'frogs-synth', name: 'Frogs', note: 'Pulsed square-wave croaks', kind: 'synth', cat: 'Wildlife', synth: 'frogs', volume: 0.3 },
  // places
  { id: 'fireplace', name: 'Fireplace', note: 'Fire in a stove', kind: 'recording', cat: 'Places', file: 'fireplace.m4a', volume: 0.6 },
  { id: 'cafe', name: 'Café chatter', note: 'Bustling café room tone', kind: 'recording', cat: 'Places', file: 'cafe.m4a', volume: 0.35 },
  { id: 'market', name: 'Farmers market', note: 'A crowd on a Saturday morning', kind: 'recording', cat: 'Places', file: 'market.m4a', volume: 0.35 },
  { id: 'typing', name: 'Keyboard', note: 'Mechanical keys, someone working', kind: 'recording', cat: 'Places', file: 'typing.m4a', volume: 0.3 },
  { id: 'fan-rec', name: 'Air conditioner', note: 'A room with the fan running', kind: 'recording', cat: 'Places', file: 'fan.m4a', volume: 0.4 },
  { id: 'chimes', name: 'Wind chimes', note: 'Chimes in a light breeze', kind: 'recording', cat: 'Places', file: 'chimes.m4a', volume: 0.3 },
  { id: 'fire', name: 'Fire', note: 'Rumble plus gated crackles', kind: 'synth', cat: 'Places', synth: 'fire', volume: 0.35 },
  { id: 'fan-synth', name: 'Desk fan', note: 'Motor hum and chopped air', kind: 'synth', cat: 'Places', synth: 'fan', volume: 0.25 },
  { id: 'clock', name: 'Clock', note: 'A tick and a tock every second', kind: 'synth', cat: 'Places', synth: 'clock', volume: 0.2 },
  { id: 'bells', name: 'Bells', note: 'Distant, slow, never quite in time', kind: 'synth', cat: 'Places', synth: 'bells', volume: 0.3, reverb: 0.6 },
  // travel
  { id: 'city-rec', name: 'City at night', note: 'Traffic from a balcony', kind: 'recording', cat: 'Travel', file: 'city.m4a', volume: 0.4 },
  { id: 'train', name: 'Train ride', note: 'Inside a moving carriage', kind: 'recording', cat: 'Travel', file: 'train.m4a', volume: 0.45 },
  { id: 'airplane', name: 'Airplane cabin', note: 'Cruising altitude', kind: 'recording', cat: 'Travel', file: 'airplane.m4a', volume: 0.45 },
  { id: 'city-synth', name: 'Traffic', note: 'A rumble bed and cars passing', kind: 'synth', cat: 'Travel', synth: 'city', volume: 0.3 },
  { id: 'space', name: 'Space', note: 'Hull rumble and a drifting tone', kind: 'synth', cat: 'Travel', synth: 'space', volume: 0.35 },
  // music
  { id: 'lofi-moody', name: 'Moody lo-fi', note: 'Beat at 70 bpm, Seth Makes Sounds', kind: 'music', cat: 'Music', file: 'lofi-moody.m4a', volume: 0.45 },
  { id: 'lofi-146', name: 'Lo-fi 1-4-6', note: 'Beat at 90 bpm, Seth Makes Sounds', kind: 'music', cat: 'Music', file: 'lofi-146.m4a', volume: 0.45 },
  { id: 'lofi', name: 'Lo-fi beat', note: 'Relaxed hip-hop loop', kind: 'music', cat: 'Music', file: 'lofi-relax-beat.mp3', volume: 0.45 },
  { id: 'boombap', name: 'Boom bap drums', note: 'Hip-hop drums at 80 bpm', kind: 'music', cat: 'Music', file: 'boombap.m4a', volume: 0.4 },
  { id: 'lofi-piano', name: 'Lo-fi piano', note: 'Piano loop at 80 bpm, holizna', kind: 'music', cat: 'Music', file: 'lofi-piano.m4a', volume: 0.4 },
  { id: 'epiano', name: 'Chill e-piano', note: 'Electric piano at 80 bpm, holizna', kind: 'music', cat: 'Music', file: 'epiano.m4a', volume: 0.4 },
  { id: 'rhodes', name: 'Rhodes progression', note: 'Four jazzy chords', kind: 'music', cat: 'Music', file: 'rhodes.m4a', volume: 0.4 },
  { id: 'lofi-guitar', name: 'Lo-fi guitar', note: 'Guitar in E minor at 119 bpm', kind: 'music', cat: 'Music', file: 'lofi-guitar.m4a', volume: 0.4 },
  { id: 'plains', name: 'Plains', note: 'Acoustic guitar and keys', kind: 'music', cat: 'Music', file: 'plains.m4a', volume: 0.4 },
  { id: 'jazz', name: 'Rusted Maid', note: 'A noir jazz loop', kind: 'music', cat: 'Music', file: 'jazz.m4a', volume: 0.4 },
  { id: 'piano', name: 'Piano loop', note: 'Soft piano phrase', kind: 'music', cat: 'Music', file: 'piano-loop.mp3', volume: 0.3 },
  { id: 'calm', name: 'Calm', note: 'An ambient loop', kind: 'music', cat: 'Music', file: 'calm.m4a', volume: 0.4 },
  { id: 'lofi-synth', name: 'Lo-fi', note: 'Beat, chords and crackle, all synthesised', kind: 'synth', cat: 'Music', synth: 'lofi', volume: 0.45 },
  { id: 'pad', name: 'Pad', note: 'Slow chords under a breathing filter', kind: 'synth', cat: 'Music', synth: 'pad', volume: 0.35, reverb: 0.5 },
  { id: 'musicbox', name: 'Music box', note: 'A pentatonic melody, one note at a time', kind: 'synth', cat: 'Music', synth: 'musicbox', volume: 0.3, reverb: 0.45 },
  // tones
  { id: 'vinyl', name: 'Vinyl', note: 'Hiss, crackle and a 33 rpm wow', kind: 'synth', cat: 'Tones', synth: 'vinyl', volume: 0.35 },
  { id: 'heartbeat', name: 'Heartbeat', note: 'Sixty a minute, lub-dub', kind: 'synth', cat: 'Tones', synth: 'heartbeat', volume: 0.3 },
  { id: 'hum', name: 'Hum', note: '50 Hz with harmonics', kind: 'synth', cat: 'Tones', synth: 'hum', volume: 0.1 },
  { id: 'drone', name: 'Drone', note: 'Detuned saws under a slow filter', kind: 'synth', cat: 'Tones', synth: 'drone', volume: 0.25 },
  { id: 'white', name: 'White noise', note: 'Flat spectrum', kind: 'synth', cat: 'Tones', synth: 'white', volume: 0.15 },
  { id: 'pink', name: 'Pink noise', note: 'Equal energy per octave', kind: 'synth', cat: 'Tones', synth: 'pink', volume: 0.2 },
  { id: 'brown', name: 'Brown noise', note: 'Deep, like a distant waterfall', kind: 'synth', cat: 'Tones', synth: 'brown', volume: 0.25 },
];
export const BY_ID: Record<string, Sound> = Object.fromEntries(CATALOG.map((c) => [c.id, c]));

/** Scenes as sound ids with volumes and an optional reverb send. */
export type SceneMix = Array<[string, number] | [string, number, number]>;
export const SCENES: { group: string; scenes: { name: string; mix: SceneMix }[] }[] = [
  { group: 'Outdoors', scenes: [
    { name: 'Storm', mix: [['thunder', 0.7], ['rain-heavy', 0.55], ['wind', 0.35]] },
    { name: 'Beach', mix: [['ocean', 0.7], ['harbour', 0.2], ['wind-rec', 0.12]] },
    { name: 'Forest morning', mix: [['forest', 0.6], ['stream-rec', 0.25], ['rain', 0.1]] },
    { name: 'Mountain stream', mix: [['stream-rec', 0.55], ['birds', 0.25, 0.3], ['wind', 0.1]] },
    { name: 'Waterfall', mix: [['waterfall', 0.6], ['forest', 0.25]] },
    { name: 'Rainforest', mix: [['jungle', 0.6], ['rain-rec', 0.25], ['frogs-synth', 0.12]] },
    { name: 'Summer meadow', mix: [['meadow', 0.55], ['chimes', 0.15]] },
    { name: 'Pond at dusk', mix: [['frogs-rec', 0.5], ['night', 0.4], ['crickets', 0.12]] },
    { name: 'Blizzard', mix: [['snow', 0.5], ['wind-rec', 0.25], ['fireplace', 0.3]] },
  ] },
  { group: 'Indoors', scenes: [
    { name: 'Rainy café', mix: [['rain-rec', 0.5], ['cafe', 0.35], ['lofi', 0.45]] },
    { name: 'Fireside', mix: [['fireplace', 0.6], ['wind-rec', 0.2], ['piano', 0.3, 0.3]] },
    { name: 'Study hall', mix: [['typing', 0.35], ['cafe', 0.2], ['clock', 0.2]] },
    { name: 'Record night', mix: [['vinyl', 0.4], ['jazz', 0.35], ['fireplace', 0.2]] },
    { name: 'Cat nap', mix: [['purr', 0.5], ['rain-heavy', 0.3], ['clock', 0.12]] },
    { name: 'Night', mix: [['night', 0.55], ['hum', 0.08]] },
    { name: 'Deep focus', mix: [['hum', 0.25], ['rain', 0.25], ['brown', 0.1]] },
    { name: 'Server room', mix: [['fan-rec', 0.5], ['hum', 0.15], ['drone', 0.1]] },
  ] },
  { group: 'Music', scenes: [
    { name: 'Lo-fi study', mix: [['lofi-moody', 0.5], ['rain-rec', 0.3], ['cafe', 0.15]] },
    { name: 'Late night jazz', mix: [['jazz', 0.45], ['city-rec', 0.25], ['vinyl', 0.25]] },
    { name: 'Porch guitar', mix: [['lofi-guitar', 0.4], ['meadow', 0.35], ['chimes', 0.15]] },
    { name: 'E-piano rain', mix: [['epiano', 0.45, 0.3], ['rain-heavy', 0.3]] },
    { name: 'Synth lo-fi', mix: [['lofi-synth', 0.5], ['rain', 0.2]] },
    { name: 'Music box', mix: [['musicbox', 0.35, 0.5], ['pad', 0.25, 0.5], ['snow', 0.1]] },
    { name: 'Cathedral', mix: [['bells', 0.35, 0.8], ['pad', 0.2, 0.7], ['wind', 0.08]] },
  ] },
  { group: 'On the move', scenes: [
    { name: 'Night train', mix: [['train', 0.55], ['rain-rec', 0.3]] },
    { name: 'Red-eye flight', mix: [['airplane', 0.5], ['hum', 0.08]] },
    { name: 'Harbour morning', mix: [['harbour', 0.5], ['ocean', 0.35], ['chimes', 0.1]] },
    { name: 'City balcony', mix: [['city-rec', 0.45], ['city-synth', 0.15], ['rain-heavy', 0.2]] },
    { name: 'Sunday market', mix: [['market', 0.45], ['chimes', 0.1], ['lofi-146', 0.25]] },
  ] },
  { group: 'Elsewhere', scenes: [
    { name: 'Deep sea', mix: [['underwater', 0.55], ['drone', 0.2, 0.4], ['heartbeat', 0.15]] },
    { name: 'Space station', mix: [['space', 0.5], ['fan-synth', 0.2], ['clock', 0.1, 0.5]] },
    { name: 'Synth only', mix: [['ocean-synth', 0.4], ['stream-synth', 0.3], ['birds', 0.2], ['crickets', 0.1]] },
  ] },
];
export const SCENE_COUNT = SCENES.reduce((n, g) => n + g.scenes.length, 0);
export const SCENE_BY_NAME: Record<string, SceneMix> = Object.fromEntries(SCENES.flatMap((g) => g.scenes.map((s) => [s.name, s.mix])));

export function toLayer(c: Sound, base: string, volume = c.volume, reverb = c.reverb ?? 0): LayerConfig {
  const l: LayerConfig = c.synth ? { id: c.id, synth: c.synth, volume } : { id: c.id, src: `${base}/sounds/${c.file}`, volume };
  if (reverb > 0) l.reverb = reverb;
  return l;
}
export function sceneToLayers(mix: SceneMix, base: string): LayerConfig[] {
  return mix.filter(([id]) => BY_ID[id]).map(([id, v, r]) => toLayer(BY_ID[id], base, v, r ?? BY_ID[id].reverb ?? 0));
}

/** `id:volume:reverb,id:volume` in the URL hash, so a mix can be shared. */
export function encodeMix(layers: LayerConfig[]): string {
  return layers.map((l) => `${l.id}:${(l.volume ?? 0.5).toFixed(2)}${l.reverb ? `:${l.reverb.toFixed(2)}` : ''}`).join(',');
}
export function decodeMix(text: string, base: string): LayerConfig[] {
  return text.split(',').map((part) => {
    const [id, v, r] = part.split(':');
    const c = BY_ID[id];
    if (!c) return null;
    const vol = Math.min(1, Math.max(0, Number(v))) || c.volume;
    const rev = Math.min(1, Math.max(0, Number(r) || 0));
    return toLayer(c, base, vol, rev);
  }).filter((l): l is LayerConfig => !!l);
}
