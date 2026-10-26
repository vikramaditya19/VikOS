import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Activity, Flame, RefreshCw, ScrollText, Terminal, Volume2, VolumeX } from 'lucide-react'
import ContextMenu from './ContextMenu'
import { installGlobalUiSounds, sound } from '../../utils/sound'

const GLOW_KEY = 'vikos.glow'

// Three moods for the wallpaper. A tinted overlay sits above the wallpaper.
const GLOWS = [
  { id: 'dim', label: 'Dim', bg: 'none' },
  {
    id: 'ember',
    label: 'Ember',
    bg: 'radial-gradient(ellipse 60% 55% at 78% 22%, rgba(196,18,47,0.16), transparent 70%)',
  },
  {
    id: 'blood',
    label: 'Blood Moon',
    bg: 'radial-gradient(ellipse 75% 70% at 78% 22%, rgba(224,51,79,0.28), rgba(116,10,30,0.12) 50%, transparent 78%)',
  },
]

function readGlow() {
  try {
    const saved = Number(localStorage.getItem(GLOW_KEY))
    return Number.isInteger(saved) && saved >= 0 && saved < GLOWS.length ? saved : 1
  } catch {
    return 1
  }
}

export default function DesktopContextLayer({ onOpenApp, onToggleCodex }) {
  const [menu, setMenu] = useState(null) // { x, y, id }
  const [glow, setGlow] = useState(readGlow)
  const [muted, setMuted] = useState(() => sound.isMuted())
  const menuId = useRef(0)

  const close = useCallback(() => setMenu(null), [])

  // Global button sounds + a sound whenever a new window mounts
  useEffect(() => {
    const removeUiSounds = installGlobalUiSounds()

    let lastOpen = 0
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue
          const isWindow = node.matches('section[aria-label]') || node.querySelector('section[aria-label]')
          const now = performance.now()
          if (isWindow && now - lastOpen > 200) {
            lastOpen = now
            sound.open()
          }
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      removeUiSounds()
      observer.disconnect()
    }
  }, [])

  // Right-click handling
  useEffect(() => {
    const onContextMenu = (e) => {
      const target = e.target
      if (!(target instanceof Element)) return

      // Let text fields keep the browser's copy/paste menu
      if (target.closest('input, textarea, [contenteditable="true"]')) return

      e.preventDefault()

      // Right-click on the menu itself, the boot screen, a window, the taskbar or the launcher:
      // no desktop menu (and close any open one)
      if (target.closest('[data-context-menu]')) return
      if (target.closest('[role="status"], section, footer, [role="dialog"]')) {
        setMenu(null)
        return
      }

      menuId.current += 1
      setMenu({ x: e.clientX, y: e.clientY, id: menuId.current })
      sound.menu()
    }

    // Left-click (or any press) outside the menu closes it
    const onPointerDown = (e) => {
      if (e.target instanceof Element && e.target.closest('[data-context-menu]')) return
      setMenu(null)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenu(null)
    }
    const onDismiss = () => setMenu(null)

    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onDismiss)
    window.addEventListener('resize', onDismiss)
    window.addEventListener('wheel', onDismiss, { passive: true })

    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onDismiss)
      window.removeEventListener('resize', onDismiss)
      window.removeEventListener('wheel', onDismiss)
    }
  }, [])

  const cycleGlow = useCallback(() => {
    setGlow((current) => {
      const next = (current + 1) % GLOWS.length
      try {
        localStorage.setItem(GLOW_KEY, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const toggleSound = useCallback(() => {
    const nextMuted = !sound.isMuted()
    sound.setMuted(nextMuted)
    setMuted(nextMuted)
    if (!nextMuted) sound.on() // confirmation chime when switching back on
  }, [])

  const refreshOs = useCallback(() => {
    sound.hum(0.6)
    setTimeout(() => window.location.reload(), 550)
  }, [])

  const items = useMemo(() => {
    const list = [
      { id: 'terminal', label: 'Open Terminal', icon: Terminal, hint: 'App', onSelect: () => onOpenApp('terminal') },
      { id: 'telemetry', label: 'System Telemetry', icon: Activity, hint: 'App', onSelect: () => onOpenApp('monitor') },
    ]
    if (onToggleCodex) {
      list.push({ id: 'codex', label: 'Toggle Style Codex', icon: ScrollText, onSelect: onToggleCodex })
    }
    list.push(
      { id: 'sep-1', separator: true },
      { id: 'glow', label: 'Change Wallpaper Glow', icon: Flame, hint: GLOWS[glow].label, onSelect: cycleGlow },
      {
        id: 'sound',
        label: muted ? 'Sound: Off' : 'Sound: On',
        icon: muted ? VolumeX : Volume2,
        onSelect: toggleSound,
      },
      { id: 'sep-2', separator: true },
      { id: 'refresh', label: 'Refresh OS', icon: RefreshCw, onSelect: refreshOs },
    )
    return list
  }, [glow, muted, onOpenApp, onToggleCodex, cycleGlow, toggleSound, refreshOs])

  return (
    <>
      {/* Wallpaper glow overlay: one layer per mood, cross-faded */}
      {GLOWS.map((g, i) => (
        <div
          key={g.id}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[2] mix-blend-screen transition-opacity duration-700"
          style={{ background: g.bg, opacity: i === glow ? 1 : 0 }}
        />
      ))}

      <AnimatePresence>
        {menu && <ContextMenu key={menu.id} x={menu.x} y={menu.y} items={items} onClose={close} />}
      </AnimatePresence>
    </>
  )
}