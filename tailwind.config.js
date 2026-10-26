import { obsidian, crimson } from './src/design/tokens.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian,
        crimson,
        bone: { DEFAULT: '#e8e2d8', dim: '#b9b3a8' },
        ash: '#8d8a94',
        mist: '#5c5a64',
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        kanji: ['"Shippori Mincho"', '"Yu Mincho"', 'serif'],
      },
      boxShadow: {
        ember:
          '0 0 0 1px rgba(196,18,47,.35), 0 0 24px -4px rgba(196,18,47,.35)',
        window:
          '0 30px 80px -20px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.04)',
        'window-active':
          '0 30px 90px -20px rgba(0,0,0,.95), 0 0 0 1px rgba(196,18,47,.28), 0 0 60px -20px rgba(196,18,47,.35)',
      },
      keyframes: {
        'cloud-drift': {
          '0%': { transform: 'translate3d(-35vw,0,0)' },
          '100%': { transform: 'translate3d(135vw,0,0)' },
        },
        'moon-breathe': {
          '0%,100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
      },
      animation: {
        'cloud-drift': 'cloud-drift 150s linear infinite',
        'moon-breathe': 'moon-breathe 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}