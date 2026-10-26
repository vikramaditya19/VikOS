import FileExplorer from './FileExplorer'
import TerminalApp from './TerminalApp'
import SystemMonitor from './SystemMonitor'

const BODIES = {
  files: FileExplorer,
  terminal: TerminalApp,
  monitor: SystemMonitor,
}

function NotBuilt({ app }) {
  const Icon = app.icon
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-sm border border-crimson-700/50 bg-obsidian-950/70 text-crimson-300 shadow-ember">
        <Icon size={28} strokeWidth={1.4} />
      </span>
      <div>
        <p className="font-display text-lg font-semibold uppercase tracking-[0.22em] text-bone">{app.name}</p>
        <p className="mt-1 text-sm text-ash">{app.blurb}</p>
      </div>
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-crimson-600/60 to-transparent" />
      <p className="vik-label">Not built yet &middot; arrives in a later stage</p>
    </div>
  )
}

export default function AppBody({ app }) {
  const Body = BODIES[app.id]
  return Body ? <Body /> : <NotBuilt app={app} />
}