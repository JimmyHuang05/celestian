import ASSETS_BASE from './constants.js'
export const characterSounds = {
  'f967a2c8-252b-4a1e-8e55-9ac5fe1597e2': 'isabella-grand-theatre-v1',
  '2a9bf85c-f975-4054-9597-5f4f11414983': 'elowen',
  'bf217625-407b-4cff-ae92-4f1ba3ba8cca': 'sylvia',
  '4ea0b64e-1c59-43a5-a082-caf6c6a5a790': 'euphemia',
  '5bf8f6ab-da96-4cc6-a715-45050f289dd5': 'xianna',
  'ec561630-2810-41a0-8524-857bfa8365e1': 'day-fourteen',
}
export const soundLibrary = {
  hover: { src: `${ASSETS_BASE}/audio/sfx/hover.mp3`, volume: .05, cooldown: 100, channel: 'hover' },
  uplink: { src: `${ASSETS_BASE}/audio/sfx/uplink.mp3`, volume: .9, cooldown: 500, channel: 'uplink' },
  ...Object.fromEntries(Object.entries(characterSounds).map(([id, name]) => [id, { src: `/audio/characters/${name}.mp3?v=1`, volume: .3, channel: 'portrait', buffered: true }])),
}
