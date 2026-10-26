import AkatsukiCloud from '../brand/AkatsukiCloud'
import Embers from './Embers'

const CLOUDS = [
  { top: '10%', width: '30vw', duration: '140s', delay: '-30s', opacity: 0.12, filled: true },
  { top: '36%', width: '44vw', duration: '210s', delay: '-120s', opacity: 0.07, filled: false },
  { top: '60%', width: '26vw', duration: '110s', delay: '-70s', opacity: 0.14, filled: true },
  { top: '76%', width: '52vw', duration: '260s', delay: '-200s', opacity: 0.05, filled: false },
]

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

export default function Wallpaper() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 1. Base: deep obsidian with a faint crimson haze from the upper right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 78% 8%, #1a0207 0%, #0a0a0c 45%, #050506 100%)',
        }}
      />

      {/* 2. The crimson moon, with ripple rings */}
      <div className="absolute right-[10vw] top-[6vh] aspect-square w-[52vmin] animate-moon-breathe motion-reduce:animate-none">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <radialGradient id="vik-glow">
              <stop offset="0%" stopColor="#c4122f" stopOpacity="0.5" />
              <stop offset="45%" stopColor="#740a1e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4d0714" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="vik-core" cx="40%" cy="38%">
              <stop offset="0%" stopColor="#a30f29" />
              <stop offset="100%" stopColor="#2e040c" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill="url(#vik-glow)" />
          {[42, 34, 26, 19].map((r, i) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#c4122f"
              strokeOpacity={0.22 - i * 0.04}
              strokeWidth="0.25"
            />
          ))}
          <circle cx="50" cy="50" r="12" fill="url(#vik-core)" />
        </svg>
      </div>

      {/* 3. Drifting cloud layers */}
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute left-0 animate-cloud-drift motion-reduce:animate-none"
          style={{
            top: c.top,
            width: c.width,
            opacity: c.opacity,
            animationDuration: c.duration,
            animationDelay: c.delay,
          }}
        >
          <AkatsukiCloud filled={c.filled} className="h-auto w-full text-bone" />
        </div>
      ))}

      {/* 4. Ground fog */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38vh]"
        style={{
          background:
            'linear-gradient(to top, rgba(5,5,6,0.95), rgba(5,5,6,0.4) 55%, transparent)',
        }}
      />

      {/* 5. Watermark glyph (暁, "dawn") */}
      <div className="absolute bottom-[8vh] right-[3vw] select-none font-kanji text-[34vmin] leading-none text-bone opacity-[0.035]">
        暁
      </div>

      {/* 6. Embers */}
      <Embers />

      {/* 7. Film grain */}
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />

      {/* 8. Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)',
        }}
      />
    </div>
  )
}