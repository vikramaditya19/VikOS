import { motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'
import AkatsukiCloud from './AkatsukiCloud'
import { obsidian, crimson, neutrals } from '../../design/tokens'

function SwatchRow({ title, entries }) {
  return (
    <div>
      <p className="vik-label mb-2">{title}</p>
      <div className="flex gap-2">
        {entries.map(([name, hex]) => (
          <div key={name} className="min-w-0 flex-1">
            <div
              className="h-9 rounded-sm border border-white/[0.06]"
              style={{ background: hex }}
            />
            <p className="mt-1.5 truncate font-mono text-[10px] text-ash">{name}</p>
            <p className="font-mono text-[10px] text-mist">{hex}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StyleCodex({ onClose, constraintsRef }) {
  const controls = useDragControls()

  return (
    <motion.section
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={constraintsRef}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="vik-window absolute left-[max(1rem,calc(50%-320px))] top-[max(1rem,calc(50%-290px))] flex max-h-[calc(100vh-4rem)] w-[min(640px,calc(100vw-2rem))] flex-col"
      aria-label="Style Codex"
    >
      {/* Title bar (drag handle) */}
      <header
        className="vik-titlebar cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
      >
        <AkatsukiCloud filled className="h-4 w-auto text-bone/70" />
        <h2 className="vik-title flex-1">Style Codex</h2>
        <button
          type="button"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Close Style Codex"
          className="vik-focus grid h-6 w-6 place-items-center rounded-sm text-ash transition-colors hover:bg-crimson-600 hover:text-white"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </header>

      {/* Content */}
      <div className="flex flex-col gap-6 overflow-y-auto p-5">
        <SwatchRow title="Obsidian" entries={Object.entries(obsidian)} />
        <SwatchRow title="Crimson" entries={Object.entries(crimson)} />
        <SwatchRow title="Neutrals" entries={Object.entries(neutrals)} />

        <div>
          <p className="vik-label mb-3">Typography</p>
          <div className="space-y-2">
            <p className="font-display text-2xl font-semibold uppercase tracking-[0.2em] text-bone">
              vikOS
            </p>
            <p className="font-sans text-sm text-bone-dim">
              IBM Plex Sans: interface text, labels, and body copy.
            </p>
            <p className="font-mono text-xs text-ash">
              JetBrains Mono: paths, terminal, system readouts.
            </p>
          </div>
        </div>

        <div>
          <p className="vik-label mb-3">Surfaces</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border border-white/[0.06] bg-obsidian-850 p-3">
              <p className="font-mono text-[10px] text-ash">Resting</p>
            </div>
            <div className="rounded-md border border-white/[0.06] bg-obsidian-800 p-3 shadow-window-active">
              <p className="font-mono text-[10px] text-ash">Active</p>
            </div>
            <div className="rounded-md bg-obsidian-800 p-3 shadow-ember">
              <p className="font-mono text-[10px] text-crimson-300">Ember</p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}