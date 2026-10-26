// vikOS sound engine: every sound is synthesized live with the Web Audio API.
// Browsers only allow audio after a user gesture, so the AudioContext is
// created lazily on the first sound (which is always triggered by a click).

const MUTE_KEY = 'vikos.sound.muted'

let ctx = null
let master = null
let muted = false
let lastTick = 0

try {
  muted = localStorage.getItem(MUTE_KEY) === '1'
} catch {
  /* storage unavailable: stay unmuted */
}

function getCtx() {
  if (muted) return null
  if (!ctx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioCtor) return null
    ctx = new AudioCtor()
    const compressor = ctx.createDynamicsCompressor()
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(compressor)
    compressor.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// A single oscillator with a quick attack and exponential decay.
function tone(c, { type = 'sine', from, to = from, at = 0, dur = 0.1, gain = 0.1, attack = 0.004, filter }) {
  const t0 = c.currentTime + at
  const osc = c.createOscillator()
  const env = c.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)

  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(gain, t0 + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  if (filter) {
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = filter
    osc.connect(f)
    f.connect(env)
  } else {
    osc.connect(env)
  }
  env.connect(master)

  osc.start(t0)
  osc.stop(t0 + dur + 0.03)
}

// A short burst of noise swept through a band-pass filter (a "whoosh").
function sweep(c, { at = 0, dur = 0.25, from, to, gain = 0.05, q = 1.2 }) {
  const t0 = c.currentTime + at
  const length = Math.max(1, Math.floor(c.sampleRate * dur))
  const buffer = c.createBuffer(1, length, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1

  const src = c.createBufferSource()
  src.buffer = buffer

  const band = c.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = q
  band.frequency.setValueAtTime(from, t0)
  band.frequency.exponentialRampToValueAtTime(to, t0 + dur)

  const env = c.createGain()
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.3)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  src.connect(band)
  band.connect(env)
  env.connect(master)
  src.start(t0)
  src.stop(t0 + dur + 0.03)
}

export const sound = {
  isMuted: () => muted,

  setMuted(value) {
    muted = Boolean(value)
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      /* ignore */
    }
  },

  // Button press: a crisp, dry tick
  click() {
    const c = getCtx()
    if (!c) return
    const now = performance.now()
    if (now - lastTick < 35) return // avoid stacked ticks
    lastTick = now
    tone(c, { type: 'triangle', from: 1900, to: 950, dur: 0.045, gain: 0.07 })
    tone(c, { type: 'sine', from: 240, to: 140, dur: 0.06, gain: 0.05 })
  },

  // Menu item hover / keyboard navigation: very quiet blip
  hover() {
    const c = getCtx()
    if (!c) return
    tone(c, { type: 'sine', from: 1250, dur: 0.03, gain: 0.025 })
  },

  // Window opens: low rising hum, a whoosh, and a high ping
  open() {
    const c = getCtx()
    if (!c) return
    tone(c, { type: 'sine', from: 90, to: 190, dur: 0.38, gain: 0.12, attack: 0.03, filter: 700 })
    sweep(c, { dur: 0.26, from: 420, to: 2600, gain: 0.05 })
    tone(c, { type: 'sine', from: 1320, dur: 0.22, at: 0.1, gain: 0.04 })
  },

  // Window closes: the open sound, falling
  close() {
    const c = getCtx()
    if (!c) return
    tone(c, { type: 'sine', from: 210, to: 70, dur: 0.28, gain: 0.11, attack: 0.01, filter: 600 })
    sweep(c, { dur: 0.2, from: 2200, to: 300, gain: 0.04 })
  },

  minimize() {
    const c = getCtx()
    if (!c) return
    tone(c, { type: 'triangle', from: 760, to: 300, dur: 0.14, gain: 0.07, filter: 2400 })
  },

  maximize() {
    const c = getCtx()
    if (!c) return
    tone(c, { type: 'triangle', from: 380, to: 820, dur: 0.12, gain: 0.07, filter: 2400 })
    tone(c, { type: 'sine', from: 1180, dur: 0.12, at: 0.08, gain: 0.03 })
  },

  // Context menu appears
  menu() {
    const c = getCtx()
    if (!c) return
    tone(c, { type: 'sine', from: 520, to: 700, dur: 0.07, gain: 0.05 })
    tone(c, { type: 'sine', from: 1040, dur: 0.09, at: 0.04, gain: 0.025 })
  },

  // Rising confirmation (used when sound is switched back on)
  on() {
    const c = getCtx()
    if (!c) return
    tone(c, { type: 'sine', from: 520, dur: 0.09, gain: 0.07 })
    tone(c, { type: 'sine', from: 780, dur: 0.12, at: 0.08, gain: 0.07 })
  },

  error() {
    const c = getCtx()
    if (!c) return
    tone(c, { type: 'sawtooth', from: 150, dur: 0.12, gain: 0.06, filter: 900 })
    tone(c, { type: 'sawtooth', from: 120, dur: 0.16, at: 0.13, gain: 0.06, filter: 900 })
  },

  // Deep drone that swells and fades (used by Refresh OS)
  hum(seconds = 0.6) {
    const c = getCtx()
    if (!c) return
    const t0 = c.currentTime
    const env = c.createGain()
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(0.14, t0 + seconds * 0.4)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds)

    const lowpass = c.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.setValueAtTime(260, t0)
    lowpass.frequency.exponentialRampToValueAtTime(900, t0 + seconds * 0.5)

    lowpass.connect(env)
    env.connect(master)

    ;[55, 55.7, 110].forEach((freq) => {
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(lowpass)
      osc.start(t0)
      osc.stop(t0 + seconds + 0.05)
    })
  },
}

// Installs one listener that gives sound to every button in the OS,
// including window controls (matched by aria-label). Returns a cleanup function.
// Add data-sound="off" to any element whose buttons should stay silent.
export function installGlobalUiSounds() {
  const onPointerDown = (e) => {
    const el = e.target
    if (!(el instanceof Element)) return
    const btn = el.closest('button, [role="button"]')
    if (!btn || btn.disabled) return
    if (btn.closest('[data-sound="off"]')) return

    const label = (btn.getAttribute('aria-label') || '').trim().toLowerCase()
    if (label.startsWith('close')) sound.close()
    else if (label.startsWith('minimi')) sound.minimize()
    else if (label.startsWith('maximi') || label.startsWith('restore')) sound.maximize()
    else sound.click()
  }

  document.addEventListener('pointerdown', onPointerDown, true)
  return () => document.removeEventListener('pointerdown', onPointerDown, true)
}