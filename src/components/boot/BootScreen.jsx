import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CLOUD_PATHS, CLOUD_VIEWBOX } from '../brand/cloudPaths'

const STATUS = [
  'Sealing the obsidian vault',
  'Gathering the clouds',
  'Kindling the ember',
  'Awakening vikOS',
]
const STEP_MS = 850
const TOTAL_MS = STATUS.length * STEP_MS + 500

export default function BootScreen({ onDone }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = STATUS.map((_, i) => setTimeout(() => setStep(i), i * STEP_MS))
    timers.push(setTimeout(onDone, TOTAL_MS))

    const skip = () => onDone()
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)

    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [onDone])

  return (
    <motion.div
      role="status"
      aria-label="vikOS is starting"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' } }}
      className="absolute inset-0 z-[2000] grid place-items-center overflow-hidden bg-obsidian-950"
    >
      {/* Crimson glow behind the insignia */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(40% 36% at 50% 46%, rgba(116,10,30,0.35), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center">
        <svg viewBox={CLOUD_VIEWBOX} className="w-64 text-crimson-500" aria-hidden="true">
          {/* Soft fill fades in after the outline is drawn */}
          <motion.path
            d={CLOUD_PATHS[0]}
            fill="rgba(196,18,47,1)"
            stroke="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.32 }}
            transition={{ delay: 1.7, duration: 1 }}
          />
          {CLOUD_PATHS.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 + i * 0.35, ease: 'easeInOut' }}
            />
          ))}
        </svg>

        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.1em' }}
          animate={{ opacity: 1, letterSpacing: '0.55em' }}
          transition={{ delay: 1.1, duration: 1.6, ease: 'easeOut' }}
          className="mt-8 pl-[0.55em] font-display text-3xl font-semibold uppercase text-bone"
        >
          vikOS
        </motion.h1>

        {/* Progress line */}
        <div className="mt-10 h-px w-64 overflow-hidden bg-white/[0.08]">
          <motion.div
            className="h-full bg-crimson-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: TOTAL_MS / 1000 - 0.4, ease: 'easeInOut' }}
          />
        </div>

        <p className="vik-label mt-4 h-4 text-ash">{STATUS[step]}</p>
      </div>

      <p className="vik-label absolute bottom-6">Click or press any key to skip</p>
    </motion.div>
  )
}