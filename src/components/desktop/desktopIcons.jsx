import { useEffect, useState } from 'react'
import { APPS } from '../../apps/registry'

export default function DesktopIcons({ onOpenApp }) {
  const [selected, setSelected] = useState(null)

  // Clicking anywhere that isn't an icon clears the selection
  useEffect(() => {
    const onPointerDown = (e) => {
      if (!e.target.closest('[data-desktop-icon]')) setSelected(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <nav
      aria-label="Desktop"
      className="absolute inset-0 flex flex-col flex-wrap content-start gap-1 p-3"
    >
      {APPS.map((app) => {
        const Icon = app.icon
        const isSelected = selected === app.id
        return (
          <button
            key={app.id}
            type="button"
            data-desktop-icon
            onClick={() => setSelected(app.id)}
            onDoubleClick={() => onOpenApp(app.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onOpenApp(app.id)
            }}
            className={`vik-focus group flex w-24 flex-col items-center gap-2 rounded-sm border px-1 py-2.5 transition-colors ${
              isSelected
                ? 'border-crimson-600/50 bg-crimson-900/25'
                : 'border-transparent hover:bg-white/[0.04]'
            }`}
          >
            <span
              className={`grid h-11 w-11 place-items-center rounded-sm border bg-obsidian-900/80 transition-colors ${
                isSelected
                  ? 'border-crimson-500/70 text-crimson-300'
                  : 'border-white/[0.08] text-bone-dim group-hover:border-crimson-700/60 group-hover:text-bone'
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
            </span>
            <span className="text-center text-[11px] font-medium leading-tight tracking-wide text-bone [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
              {app.name}
            </span>
          </button>
        )
      })}
    </nav>
  )
}