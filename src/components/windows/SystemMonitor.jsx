import { useEffect, useState } from 'react'
import { Clock, Database, Gauge, Monitor, Wifi } from 'lucide-react'

const HISTORY = 60

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function Spark({ data, max }) {
  const points = data
    .map((v, i) => {
      const x = ((HISTORY - data.length + i) / (HISTORY - 1)) * 120
      const y = 30 - Math.min(1, v / max) * 28
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 120 32" preserveAspectRatio="none" className="mt-3 h-10 w-full text-crimson-500" aria-hidden="true">
      <line x1="0" y1="31" x2="120" y2="31" stroke="rgba(255,255,255,0.08)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {data.length > 1 && (
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}

function Card({ icon: Icon, label, value, unit, children }) {
  return (
    <div className="rounded-sm border border-white/[0.06] bg-obsidian-950/70 p-3">
      <p className="vik-label flex items-center gap-2">
        <Icon size={12} /> {label}
      </p>
      <p className="mt-2 font-mono text-2xl text-bone">
        {value}
        <span className="ml-1 text-xs text-ash">{unit}</span>
      </p>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-1.5 last:border-0">
      <span className="text-xs text-ash">{label}</span>
      <span className="truncate font-mono text-xs text-bone-dim">{value}</span>
    </div>
  )
}

export default function SystemMonitor() {
  const [fps, setFps] = useState([])
  const [heap, setHeap] = useState([]) // megabytes
  const [uptime, setUptime] = useState(0)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [viewport, setViewport] = useState(() => `${window.innerWidth} × ${window.innerHeight}`)

  // Frame counter via requestAnimationFrame, sampled once per second
  useEffect(() => {
    let frames = 0
    let raf = 0
    const count = () => {
      frames += 1
      raf = requestAnimationFrame(count)
    }
    raf = requestAnimationFrame(count)

    const sample = () => {
      const current = frames
      frames = 0
      setFps((prev) => [...prev, current].slice(-HISTORY))

      const mem = performance.memory
      if (mem) setHeap((prev) => [...prev, mem.usedJSHeapSize / 1048576].slice(-HISTORY))

      setUptime(performance.now() / 1000)
    }
    sample()
    const id = setInterval(sample, 1000)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    const resize = () => setViewport(`${window.innerWidth} × ${window.innerHeight}`)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const lastFps = fps.length ? fps[fps.length - 1] : 0
  const lastHeap = heap.length ? heap[heap.length - 1] : null
  const heapMax = Math.max(64, ...heap)

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-obsidian-950/80 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card icon={Gauge} label="Frame rate" value={lastFps} unit="fps">
          <Spark data={fps} max={75} />
        </Card>

        <Card icon={Database} label="JS heap" value={lastHeap === null ? 'n/a' : lastHeap.toFixed(1)} unit={lastHeap === null ? '' : 'MB'}>
          {lastHeap === null ? (
            <p className="mt-3 text-[11px] leading-relaxed text-mist">Heap readings are only provided by Chrome and Edge.</p>
          ) : (
            <Spark data={heap} max={heapMax} />
          )}
        </Card>

        <Card icon={Clock} label="Uptime" value={formatUptime(uptime)} unit="">
          <p className="mt-3 text-[11px] text-mist">Time since this page loaded.</p>
        </Card>

        <Card icon={Wifi} label="Network" value={online ? 'Online' : 'Offline'} unit="">
          <p className="mt-3 text-[11px] text-mist">Reported by the browser.</p>
        </Card>
      </div>

      <div className="mt-3 rounded-sm border border-white/[0.06] bg-obsidian-950/70 p-3">
        <p className="vik-label mb-2 flex items-center gap-2">
          <Monitor size={12} /> Device
        </p>
        <Row label="Logical cores" value={navigator.hardwareConcurrency ?? 'unknown'} />
        <Row label="Device memory" value={navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'unknown'} />
        <Row label="Viewport" value={viewport} />
        <Row label="Pixel ratio" value={window.devicePixelRatio} />
        <Row label="Language" value={navigator.language} />
        <Row label="Secure context" value={window.isSecureContext ? 'yes (WebCrypto available)' : 'no'} />
      </div>
    </div>
  )
}