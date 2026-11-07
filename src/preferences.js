// Preserve existing keys while centralizing defaults, validation and migration.
export const preferenceSchema = {
  musicEnabled: { key: 'celestian-music-enabled', fallback: null, valid: value => typeof value === 'boolean' },
  musicPositions: { key: 'celestian-music-positions', session: true, fallback: {}, valid: value => value && typeof value === 'object' && !Array.isArray(value) },
  soundMuted: { key: 'celestian-sound-muted', legacy: 'profile-sound-muted', fallback: false, valid: value => typeof value === 'boolean' },
  introSeen: { key: 'hasSeenIntro', session: true, fallback: false, valid: value => typeof value === 'boolean' },
  aiQuota: { key: 'babel_ai_quota', fallback: null, valid: value => value && typeof value.date === 'string' && Number.isFinite(value.count) && value.count >= 0 },
}
function storage(schema) { return schema.session ? sessionStorage : localStorage }
export function readPreference(name) {
  const schema = preferenceSchema[name]
  if (!schema) throw new Error(`Unknown preference: ${name}`)
  try {
    const raw = storage(schema).getItem(schema.key) ?? (schema.legacy ? storage(schema).getItem(schema.legacy) : null)
    const value = raw === null ? null : JSON.parse(raw)
    if (schema.valid(value)) return value
  } catch { /* Corrupt or unavailable storage falls back to the schema. */ }
  return structuredClone(schema.fallback)
}
export function writePreference(name, value) {
  const schema = preferenceSchema[name]
  if (!schema?.valid(value)) return false
  try { storage(schema).setItem(schema.key, JSON.stringify(value)) } catch { /* Settings remain usable for this session. */ }
  window.dispatchEvent(new CustomEvent('celestian:preference', { detail: { name, value } }))
  return true
}
export function subscribePreference(name, callback) {
  const local = event => { if (event.detail.name === name) callback(event.detail.value) }
  const remote = event => { if (event.key === preferenceSchema[name].key) callback(readPreference(name)) }
  window.addEventListener('celestian:preference', local)
  window.addEventListener('storage', remote)
  return () => { window.removeEventListener('celestian:preference', local); window.removeEventListener('storage', remote) }
}
export function readMusicPreference() {
  const enabled = readPreference('musicEnabled')
  if (enabled !== null) return { enabled, hasPreference: true }
  try {
    const old = JSON.parse(sessionStorage.getItem('eden_bgm_state') || 'null')
    const faction = localStorage.getItem('celestian-faction-muted')
    const value = typeof old?.isPlaying === 'boolean' ? old.isPlaying : faction === null ? null : faction === 'false'
    if (value !== null) { writePreference('musicEnabled', value); return { enabled: value, hasPreference: true } }
  } catch { /* Defaults apply. */ }
  return { enabled: false, hasPreference: false }
}
