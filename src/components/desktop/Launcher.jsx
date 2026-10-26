import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Search } from 'lucide-react'
import AkatsukiCloud from '../brand/AkatsukiCloud'
import { APPS } from '../../apps/registry'

export default function Launcher({ onOpenApp, onRestart, onClose }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return APPS.filter((app) => app.name.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <>
      {/* Invisible backdrop: clicking outside the panel closes it */}
      <div
        className="absolute inset-x-0 bottom-12 top-0 z-[900]"
        onPointerDown={onClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-label="Application launcher"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="vik-window absolute bottom-14 left-3 z-[950] flex max-h-[min(540px,calc(100%-4.5rem))] w-[min(380px,calc(100%-1.5rem))] flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3">
          <AkatsukiCloud filled className="h-4 w-auto text-crimson-400" />
          <div className="flex-1">
            <p className="vik-title text-bone">vikOS</p>
            <p className="vik-label mt-0.5">Application Launcher</p>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-white/[0.05] p-3">
          <label className="flex items-center gap-2 rounded-sm border border-white/[0.08] bg-obsidian-950/70 px-3 py-2 focus-within:border-crimson-600/70">
            <Search size={14} className="text-ash" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) onOpenApp(results[0].id)
              }}
              placeholder="Search applications"
              className="w-full bg-transparent text-sm text-bone placeholder:text-mist focus:outline-none"
              style={{ userSelect: 'text' }}
            />
          </label>
        </div>

        {/* App list */}
        <ul className="flex-1 overflow-y-auto p-2">
          {results.map((app) => {
            const Icon = app.icon
            return (
              <li key={app.id}>
                <button
                  type="button"
                  onClick={() => onOpenApp(app.id)}
                  className="vik-focus group flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-crimson-900/25"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-white/[0.08] bg-obsidian-950/70 text-bone-dim transition-colors group-hover:border-crimson-600/60 group-hover:text-crimson-300">
                    <Icon size={17} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-bone">{app.name}</span>
                    <span className="block truncate text-xs text-ash">{app.blurb}</span>
                  </span>
                </button>
              </li>
            )
          })}
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-ash">
              Nothing in the vault matches &ldquo;{query}&rdquo;.
            </li>
          )}
        </ul>

        {/* Footer */}
        <div className="border-t border-white/[0.05] p-2">
          <button
            type="button"
            onClick={onRestart}
            className="vik-focus flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-xs text-ash transition-colors hover:bg-white/[0.04] hover:text-bone"
          >
            <RotateCcw size={14} />
            <span>Restart vikOS</span>
          </button>
        </div>
      </motion.div>
    </>
  )
}