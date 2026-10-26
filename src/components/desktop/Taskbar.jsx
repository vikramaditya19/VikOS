import { useEffect, useState } from 'react'
import AkatsukiCloud from '../brand/AkatsukiCloud'
import { getApp } from '../../apps/registry'

function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="flex h-full flex-col items-end justify-center px-3 leading-tight" title={now.toLocaleString()}>
      <span className="font-mono text-[13px] tracking-wider text-bone">{time}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ash">{date}</span>
    </div>
  )
}

export default function Taskbar({ launcherOpen, onToggleLauncher, windows, activeAppId, onTaskbarClick }) {
  return (
    <footer className="absolute inset-x-0 bottom-0 z-[1000] flex h-12 items-stretch border-t border-white/[0.06] bg-obsidian-950/95 backdrop-blur-md">
      {/* Crimson hairline along the top edge */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-px h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(196,18,47,0.55) 30%, rgba(196,18,47,0.55) 70%, transparent)',
        }}
      />

      {/* Launcher button */}
      <button
        type="button"
        onClick={onToggleLauncher}
        aria-label="Open application launcher"
        aria-expanded={launcherOpen}
        className={`vik-focus flex items-center gap-2.5 border-r border-white/[0.06] px-4 transition-colors ${
          launcherOpen ? 'bg-crimson-900/40' : 'hover:bg-white/[0.04]'
        }`}
      >
        <AkatsukiCloud filled className="h-4 w-auto text-crimson-400" />
        <span className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-bone">vikOS</span>
      </button>

      {/* Running apps */}
      <div className="flex min-w-0 flex-1 items-stretch gap-px overflow-x-auto px-2">
        {windows.map((w) => {
          const app = getApp(w.appId)
          const Icon = app.icon
          const isActive = w.appId === activeAppId
          return (
            <button
              key={w.appId}
              type="button"
              onClick={() => onTaskbarClick(w.appId)}
              aria-label={`${app.name}${w.minimized ? ' (minimized)' : ''}`}
              className={`vik-focus relative flex min-w-[8.5rem] max-w-[11rem] items-center gap-2 px-3 text-xs transition-colors ${
                isActive ? 'bg-white/[0.05] text-bone' : 'text-ash hover:bg-white/[0.03] hover:text-bone-dim'
              } ${w.minimized ? 'opacity-60' : ''}`}
            >
              <Icon size={14} strokeWidth={1.6} className={isActive ? 'text-crimson-400' : ''} />
              <span className="truncate">{app.name}</span>
              <span
                className={`absolute inset-x-3 bottom-0 h-px ${
                  isActive ? 'bg-crimson-500' : w.minimized ? 'bg-transparent' : 'bg-white/[0.12]'
                }`}
              />
            </button>
          )
        })}
      </div>

      <div className="border-l border-white/[0.06]">
        <Clock />
      </div>
    </footer>
  )
}