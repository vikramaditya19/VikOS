import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, Minus, X } from 'lucide-react'
import AppBody from '../windows/AppBody'

const MIN_W = 320
const MIN_H = 220

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max))

const HANDLES = [
  { dir: 'n', cls: 'inset-x-3 top-0 h-1.5 cursor-ns-resize' },
  { dir: 's', cls: 'inset-x-3 bottom-0 h-1.5 cursor-ns-resize' },
  { dir: 'w', cls: 'inset-y-3 left-0 w-1.5 cursor-ew-resize' },
  { dir: 'e', cls: 'inset-y-3 right-0 w-1.5 cursor-ew-resize' },
  { dir: 'nw', cls: 'left-0 top-0 h-3 w-3 cursor-nwse-resize' },
  { dir: 'ne', cls: 'right-0 top-0 h-3 w-3 cursor-nesw-resize' },
  { dir: 'sw', cls: 'bottom-0 left-0 h-3 w-3 cursor-nesw-resize' },
  { dir: 'se', cls: 'bottom-0 right-0 h-3 w-3 cursor-nwse-resize' },
]

export default function AppWindow({
  app,
  win,
  isActive,
  workspaceRef,
  onFocus,
  onUpdate,
  onClose,
  onMinimize,
  onToggleMaximize,
}) {
  const Icon = app.icon
  const stopRef = useRef(null) // removes the current drag/resize listeners

  // If the window is removed mid-drag, make sure listeners don't linger
  useEffect(() => () => stopRef.current?.(), [])

  const track = (onMove) => {
    const up = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      stopRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    stopRef.current = up
  }

  const startDrag = (e) => {
    if (e.button !== 0 || win.maximized) return
    if (e.target.closest('button')) return
    const box = workspaceRef.current?.getBoundingClientRect()
    if (!box) return

    const startX = e.clientX
    const startY = e.clientY
    const originX = win.x
    const originY = win.y
    const width = win.w

    track((ev) => {
      onUpdate({
        x: clamp(originX + ev.clientX - startX, 120 - width, box.width - 120),
        y: clamp(originY + ev.clientY - startY, 0, box.height - 40),
      })
    })
  }

  const startResize = (dir) => (e) => {
    if (e.button !== 0 || win.maximized) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const { x: ox, y: oy, w: ow, h: oh } = win

    track((ev) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let x = ox
      let y = oy
      let w = ow
      let h = oh

      if (dir.includes('e')) w = Math.max(MIN_W, ow + dx)
      if (dir.includes('s')) h = Math.max(MIN_H, oh + dy)
      if (dir.includes('w')) {
        w = Math.max(MIN_W, ow - dx)
        x = ox + (ow - w)
      }
      if (dir.includes('n')) {
        h = Math.max(MIN_H, oh - dy)
        y = oy + (oh - h)
        if (y < 0) {
          h += y
          y = 0
        }
      }
      onUpdate({ x, y, w, h })
    })
  }

  const maximized = win.maximized
  const minimized = win.minimized

  return (
    <motion.section
      aria-label={app.name}
      aria-hidden={minimized || undefined}
      onPointerDownCapture={() => {
        if (!isActive) onFocus()
      }}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={
        minimized
          ? { opacity: 0, scale: 0.94, y: 24, transitionEnd: { visibility: 'hidden' } }
          : { opacity: 1, scale: 1, y: 0, visibility: 'visible' }
      }
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        left: maximized ? 0 : win.x,
        top: maximized ? 0 : win.y,
        width: maximized ? '100%' : win.w,
        height: maximized ? '100%' : win.h,
        zIndex: win.z,
        pointerEvents: minimized ? 'none' : 'auto',
      }}
      className={`vik-window absolute flex flex-col ${maximized ? '!rounded-none' : ''} ${isActive ? '' : '!shadow-window'}`}
    >
      {/* Title bar */}
      <header
        onPointerDown={startDrag}
        onDoubleClick={(e) => {
          if (e.target.closest('button')) return
          onToggleMaximize()
        }}
        className={`vik-titlebar touch-none ${maximized ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <Icon size={14} strokeWidth={1.6} className={isActive ? 'text-crimson-400' : 'text-ash'} />
        <h2 className={`vik-title flex-1 truncate ${isActive ? '' : 'opacity-60'}`}>{app.name}</h2>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onMinimize}
            aria-label={`Minimize ${app.name}`}
            className="vik-focus grid h-6 w-6 place-items-center rounded-sm text-ash transition-colors hover:bg-white/[0.08] hover:text-bone"
          >
            <Minus size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onToggleMaximize}
            aria-label={`${maximized ? 'Restore' : 'Maximize'} ${app.name}`}
            className="vik-focus grid h-6 w-6 place-items-center rounded-sm text-ash transition-colors hover:bg-white/[0.08] hover:text-bone"
          >
            {maximized ? <Minimize2 size={13} strokeWidth={2} /> : <Maximize2 size={13} strokeWidth={2} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${app.name}`}
            className="vik-focus grid h-6 w-6 place-items-center rounded-sm text-ash transition-colors hover:bg-crimson-600 hover:text-white"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AppBody app={app} />
      </div>

      {/* Resize handles */}
      {!maximized &&
        HANDLES.map((h) => (
          <div
            key={h.dir}
            onPointerDown={startResize(h.dir)}
            aria-hidden="true"
            className={`absolute z-20 touch-none ${h.cls}`}
          />
        ))}
    </motion.section>
  )
}