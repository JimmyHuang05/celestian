import test from 'node:test'
import assert from 'node:assert/strict'
import { MusicController } from '../src/music-controller.js'

function fixture() {
  let frames = new Map(), next = 0, now = 0
  globalThis.requestAnimationFrame = callback => { frames.set(++next, callback); return next }
  globalThis.cancelAnimationFrame = id => frames.delete(id)
  const advance = ms => {
    now += ms
    const current = frames
    frames = new Map()
    for (const callback of current.values()) callback(now)
  }
  const media = () => ({
    volume: 0, paused: true, readyState: 4, preload: 'metadata',
    async play() { this.paused = false },
    pause() { this.paused = true },
  })
  const home = media(), encyclopedia = media()
  const controller = new MusicController({
    home: { audio: home, volume: 1 },
    encyclopedia: { audio: encyclopedia, volume: .25 },
  }, { enabled: true, hasPreference: true })
  const settle = async () => { await Promise.resolve(); advance(0) }
  return { controller, home, encyclopedia, advance, settle }
}

test('two tracks overlap at equal power; outgoing pauses only after fade completes', async () => {
  const f = fixture()
  f.controller.setTrack('home'); await f.settle(); f.advance(2500)
  assert.equal(f.home.volume, 1)
  f.controller.setTrack('encyclopedia'); await f.settle(); f.advance(1250)
  assert.equal(f.home.paused, false)
  assert.equal(f.encyclopedia.paused, false)
  assert.ok(Math.abs(f.home.volume ** 2 + (f.encyclopedia.volume / .25) ** 2 - 1) < 1e-8)
  f.advance(1250)
  assert.equal(f.home.paused, true)
  assert.equal(f.encyclopedia.volume, .25)
})

test('slow or blocked incoming playback leaves the outgoing song audible', async () => {
  const f = fixture()
  f.controller.setTrack('home'); await f.settle(); f.advance(2500)
  let ready
  f.encyclopedia.play = () => new Promise(resolve => { ready = () => { f.encyclopedia.paused = false; resolve() } })
  f.controller.setTrack('encyclopedia'); await f.settle(); f.advance(5000)
  assert.equal(f.home.volume, 1)
  ready(); await f.settle()
  f.encyclopedia.readyState = 2
  f.advance(5000)
  assert.equal(f.home.volume, 1)
  f.encyclopedia.readyState = 4
  f.advance(2500)
  assert.equal(f.encyclopedia.volume, .25)
  f.home.play = async () => { throw new Error('Autoplay denied') }
  f.controller.setTrack('home'); await f.settle(); f.advance(5000)
  assert.equal(f.encyclopedia.volume, .25)
  assert.equal(f.encyclopedia.paused, false)
})

test('rapid reversal starts from current volumes without a jump or stale fade', async () => {
  const f = fixture()
  f.controller.setTrack('home'); await f.settle(); f.advance(2500)
  f.controller.setTrack('encyclopedia'); await f.settle(); f.advance(900)
  const previous = [f.home.volume, f.encyclopedia.volume]
  f.controller.setTrack('home'); await f.settle()
  assert.deepEqual([f.home.volume, f.encyclopedia.volume], previous)
  f.advance(2500)
  assert.equal(f.home.volume, 1)
  assert.equal(f.encyclopedia.paused, true)
})

test('mute persists across navigation and interaction retries', async () => {
  const f = fixture()
  f.controller.setTrack('home'); await f.settle(); f.advance(2500)
  f.controller.toggle(); await f.settle(); f.advance(2500)
  f.controller.setTrack('encyclopedia'); f.controller.retry()
  await f.settle(); f.advance(2500)
  assert.equal(f.controller.enabled, false)
  assert.equal(f.home.paused, true)
  assert.equal(f.encyclopedia.paused, true)
  assert.equal(f.encyclopedia.volume, 0)
})

test('backgrounding pauses both songs and returning fades in the selected track', async () => {
  const f = fixture()
  f.controller.setTrack('home'); await f.settle(); f.advance(2500)
  f.controller.setTrack('encyclopedia'); await f.settle(); f.advance(800)
  f.controller.setHidden(true); f.advance(5000)
  assert.equal(f.home.paused, true)
  assert.equal(f.encyclopedia.paused, true)
  f.controller.setHidden(false); await f.settle(); f.advance(2500)
  assert.equal(f.home.paused, true)
  assert.equal(f.encyclopedia.volume, .25)
  f.controller.destroy()
  assert.equal(f.encyclopedia.paused, true)
})

test('registering a lazy track during a fade does not give it a non-finite gain', async () => {
  const f = fixture()
  f.controller.setTrack('home'); await f.settle(); f.advance(500)
  const late = {
    volume: 0, paused: true, readyState: 4,
    async play() { this.paused = false },
    pause() { this.paused = true },
  }
  f.controller.tracks.late = { audio: late, volume: .3 }
  f.advance(1000)
  assert.equal(late.volume, 0)
  assert.equal(late.paused, true)
  assert.ok(Number.isFinite(f.home.volume))
  f.controller.setTrack('late'); await f.settle(); f.advance(2500)
  assert.equal(late.volume, .3)
  assert.equal(f.home.paused, true)
})
